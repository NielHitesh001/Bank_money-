import tempfile
import unittest
import json
from urllib.request import urlopen
from pathlib import Path
from unittest.mock import patch

import obsidian_finance_daemon as daemon


class CountrySourceTests(unittest.TestCase):
    def test_normalize_country_record(self):
        country = daemon.CountrySource._normalize({
            "name": {"common": "Exampleland"},
            "cca2": "EX",
            "cca3": "EXM",
            "region": "Test",
            "subregion": "Test Region",
            "capital": ["Example City"],
            "currencies": {"EXC": {"name": "Example currency"}},
            "population": 123,
        })

        self.assertEqual(country["name"], "Exampleland")
        self.assertEqual(country["cca3"], "EXM")
        self.assertEqual(country["currency"], "EXC")
        self.assertEqual(country["population"], 123)


class PopulationTests(unittest.TestCase):
    def test_normalize_does_not_fabricate_population(self):
        # mledoze/countries.json no longer carries a "population" field at
        # all — normalize must leave it unset (None) rather than default to
        # a misleading 0.
        country = daemon.CountrySource._normalize({
            "name": {"common": "Exampleland"},
            "cca2": "EX", "cca3": "EXM", "region": "Test", "subregion": "Test",
            "capital": ["Example City"], "currencies": {"EXC": {"name": "Example currency"}},
        })
        self.assertIsNone(country["population"])

    def test_population_source_parses_restcountries_payload(self):
        class Response:
            def raise_for_status(self):
                pass

            def json(self):
                return [
                    {"cca3": "IND", "population": 1428627663},
                    {"cca3": "USA", "population": 339996563},
                    {"cca3": "ZZZ"},  # missing population — must be skipped, not KeyError
                ]

        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            source = daemon.PopulationSource(cfg)
            with patch.object(daemon.requests, "get", return_value=Response()):
                data = source.fetch()

        self.assertEqual(data["IND"], 1428627663)
        self.assertEqual(data["USA"], 339996563)
        self.assertNotIn("ZZZ", data)

    def test_population_source_falls_back_to_cache_on_failure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            source = daemon.PopulationSource(cfg)
            source._save_cache({"population": {"IND": 1428627663}})

            with patch.object(daemon, "requests", None):
                data = source.fetch()

        self.assertEqual(data, {"IND": 1428627663})


class RenderingTests(unittest.TestCase):
    def test_currency_hub_contains_country_and_rate(self):
        country = {
            "name": "Exampleland",
            "cca3": "EXM",
        }
        rendered = daemon.render_currency_md(
            "EXC", [country], {"rates": {"EXC": 1.25}, "date": "2026-08-28"}
        )

        self.assertIn("currency_code: \"EXC\"", rendered)
        self.assertIn("USD -> EXC", rendered)
        self.assertIn("[[EXM-country|Exampleland]]", rendered)


    def test_country_render_shows_na_for_unknown_population(self):
        country = {
            "name": "Exampleland", "cca2": "EX", "cca3": "EXM", "region": "Test",
            "subregion": "Test Region", "capital": ["Example City"], "currency": "EXC",
            "population": None,
        }
        rendered = daemon.render_country_md(country, {"rates": {}}, None)
        self.assertIn('population: "N/A"', rendered)
        self.assertNotIn("population: 0", rendered)


class ManagedWriterTests(unittest.TestCase):
    def test_preserves_notes_on_regeneration(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            writer = daemon.ManagedFileWriter(cfg)
            path = Path(temp_dir) / "note.md"
            writer.write(path, "---\ntype: test\n---\nGenerated\n")
            path.write_text(path.read_text() + "\n## 📝 Notes\nKeep this note.\n")

            writer.write(path, "---\ntype: test\n---\nRegenerated\n")

            content = path.read_text()
            self.assertIn("Regenerated", content)
            self.assertIn("Keep this note.", content)
            self.assertNotIn("Generated\n\n##", content)


class RailStatusTests(unittest.TestCase):
    def test_always_open_rail(self):
        is_open, window = daemon.RailStatusCalculator.is_open({
            "hours": {"tz": "UTC", "open": 0, "close": 24, "days": "7"}
        })

        self.assertTrue(is_open)
        self.assertEqual(window, "24/7")


class PolicyRateSourceTests(unittest.TestCase):
    def test_parses_latest_live_fred_observation(self):
        class Response:
            text = "observation_date,DFF\n2026-08-25,3.60\n2026-08-26,3.63\n"

            def raise_for_status(self):
                pass

        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            source = daemon.PolicyRateSource(cfg)
            with patch.object(daemon.requests, "get", return_value=Response()):
                rates = source.fetch()

        self.assertEqual(rates["USA"]["policy_rate"], 3.63)
        self.assertEqual(rates["USA"]["policy_rate_as_of"], "2026-08-26")
        self.assertEqual(rates["USA"]["policy_rate_source"], "FRED DFF")

    def test_uses_cache_when_network_is_unavailable(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            source = daemon.PolicyRateSource(cfg)
            cached = {"USA": {"policy_rate": 3.5, "policy_rate_source": "cache"}}
            source._save_cache({"rates": cached})

            with patch.object(daemon, "requests", None):
                rates = source.fetch()

            self.assertEqual(rates, cached)

    def test_maps_ecb_rate_to_euro_area_countries(self):
        class Response:
            def __init__(self, series_id):
                self.text = f"observation_date,{series_id}\n2026-08-27,2.25\n"

            def raise_for_status(self):
                pass

        def response_for_series(_url, *, params, **_kwargs):
            return Response(params["id"])

        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            source = daemon.PolicyRateSource(cfg)
            with patch.object(daemon.requests, "get", side_effect=response_for_series):
                rates = source.fetch()

        self.assertEqual(rates["DEU"]["policy_rate"], 2.25)
        self.assertEqual(rates["FRA"]["policy_rate_source"], "FRED ECBDFR")
        self.assertEqual(rates["NLD"]["policy_rate_as_of"], "2026-08-27")


class VaultBuilderTests(unittest.TestCase):
    def test_offline_build_creates_all_graph_sections(self):
        countries = [
            {
                "name": "Exampleland",
                "cca2": "EX",
                "cca3": "EXM",
                "region": "Test",
                "subregion": "Test Region",
                "capital": ["Example City"],
                "currency": "EXC",
                "population": 123,
            }
        ]
        with tempfile.TemporaryDirectory() as temp_dir:
            cfg = daemon.Config(vault_path=Path(temp_dir))
            builder = daemon.VaultBuilder(cfg)
            builder.ensure_dirs()
            builder.country_source.fetch = lambda: countries
            builder.population_source.fetch = lambda: {}
            builder.fx_source._load_cache = lambda: {
                "rates": {"EXC": 1.25}, "date": "2026-08-28"
            }

            builder.job_countries()
            builder.job_rail_status()

            self.assertTrue((Path(temp_dir) / "10-Countries/EXM-country.md").exists())
            self.assertTrue((Path(temp_dir) / "20-Central-Banks/EXM-central-bank.md").exists())
            self.assertTrue((Path(temp_dir) / "40-Currencies/EXC-currency.md").exists())
            self.assertTrue((Path(temp_dir) / "30-Payment-Rails/SWIFT-rail.md").exists())
            self.assertTrue((Path(temp_dir) / "00-MOC/Countries-MOC.md").exists())
            self.assertTrue((Path(temp_dir) / "00-MOC/Test-MOC.md").exists())

            export = json.loads(cfg.graph_export_file.read_text())
            self.assertEqual(export["schema_version"], "1.0")
            self.assertIn("country:EXM", {node["id"] for node in export["nodes"]})
            self.assertIn("currency:EXC", {node["id"] for node in export["nodes"]})
            self.assertIn(
                {"source": "country:EXM", "target": "currency:EXC", "type": "uses"},
                export["links"],
            )


class DashboardDataServerTests(unittest.TestCase):
    def test_serves_the_current_graph_export_on_localhost(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            export_file = Path(temp_dir) / "world-money-graph.v1.json"
            export_file.write_text('{"schema_version":"1.0"}')
            server = daemon.DashboardDataServer(export_file, 0)
            server.start()
            try:
                with urlopen(server.url) as response:
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.headers["Access-Control-Allow-Origin"], "*")
                    self.assertEqual(json.load(response)["schema_version"], "1.0")
            finally:
                server.stop()


if __name__ == "__main__":
    unittest.main()
