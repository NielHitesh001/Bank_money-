#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <iomanip>
#include <cstdlib>
#include <atomic>
#include <chrono>
#include <thread>
#include <ixwebsocket/IXNetSystem.h>
#include <ixwebsocket/IXWebSocketServer.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// --- ANSI Escape Codes for Bloomberg Aesthetic ---
const std::string RESET   = "\033[0m";
const std::string BOLD    = "\033[1m";
const std::string AMBER   = "\033[38;5;214m"; // Classic Bloomberg Amber
const std::string CYAN    = "\033[38;5;51m";
const std::string GREEN   = "\033[38;5;46m";
const std::string RED     = "\033[38;5;196m";
const std::string DIM     = "\033[38;5;242m";

// --- Data Models ---
struct Transaction {
    std::string date;
    std::string entity;
    std::string type;
    double amount;
    bool flagged;
};

struct SmallBank {
    std::string name;
    std::string region;
    std::string clearingCode;
    std::vector<Transaction> ledger;
};

struct MajorBank {
    std::string name;
    std::string properties; // Market Cap, Liquidity, etc.
    std::vector<SmallBank> network;
};

struct Country {
    std::string name;
    std::vector<MajorBank> majorBanks;
};

// --- Mock Database ---
std::map<int, Country> generateMockData() {
    std::map<int, Country> db;

    // USA Tree
    Country usa{"United States"};
    MajorBank jpm{"JPMorgan Chase", "Market Cap: $560B | Tier 1 Liquidity | Risk: LOW"};
    
    SmallBank firstRepublic{"First Republic Bank", "California", "FRB-CA-99"};
    firstRepublic.ledger.push_back({"2026-08-27", "Silicon Valley Tech", "WIRE IN", 450000.00, false});
    firstRepublic.ledger.push_back({"2026-08-28", "Offshore Holdings LLC", "WIRE OUT", 1200000.00, true});
    
    jpm.network.push_back(firstRepublic);
    usa.majorBanks.push_back(jpm);
    db[1] = usa;

    // UK Tree
    Country uk{"United Kingdom"};
    MajorBank barclays{"Barclays PLC", "Market Cap: £32B | Tier 1 Liquidity | Risk: MEDIUM"};
    
    SmallBank metro{"Metro Bank", "London", "MTRO-LDN-01"};
    metro.ledger.push_back({"2026-08-25", "High Street Retail", "DEPOSIT", 15000.00, false});
    metro.ledger.push_back({"2026-08-26", "Cayman Trust", "TRANSFER", 850000.00, true});
    
    barclays.network.push_back(metro);
    uk.majorBanks.push_back(barclays);
    db[2] = uk;

    return db;
}

std::string generateMockTransaction() {
    static int transactionCount = 0;
    ++transactionCount;
    const std::string transactionId = "TX_" + std::to_string(transactionCount);

    json payload = {
        {"type", "NEW_NODE"},
        {"node", {
            {"id", transactionId},
            {"name", "Wire Transfer $" + std::to_string(std::rand() % 1000 + 1) + "k"},
            {"type", "ledger transaction"},
            {"val", 3},
            {"color", "#f97316"},
        }},
        {"link", {{"source", "JPM"}, {"target", transactionId}}},
    };
    return payload.dump();
}

void streamTransactions(ix::WebSocketServer& server, std::atomic<bool>& streaming) {
    while (streaming.load()) {
        std::this_thread::sleep_for(std::chrono::seconds(2));
        if (!streaming.load()) break;

        const std::string update = generateMockTransaction();
        for (const auto& client : server.getClients()) {
            client->sendText(update);
        }
        std::cout << DIM << "[Backend] Broadcast transaction to "
                  << server.getClients().size() << " client(s)." << RESET << std::endl;
    }
}

// --- UI Helpers ---
void clearScreen() {
    // ANSI code to clear screen and move cursor to home position
    std::cout << "\033[2J\033[H";
}

void printHeader(const std::string& path) {
    std::cout << AMBER << BOLD << "================================================================================\n";
    std::cout << " MONEYTRACE SPLC NETWORK VISUALIZER | PATH: " << CYAN << path << AMBER << "\n";
    std::cout << "================================================================================" << RESET << "\n\n";
}

void printFooter() {
    std::cout << "\n" << DIM << "--------------------------------------------------------------------------------\n";
    std::cout << "[0] Go Back/Exit | Enter Selection > " << RESET;
}

// --- Main Application Loop ---
int main() {
    ix::initNetSystem();
    ix::WebSocketServer server(8080, "127.0.0.1");
    server.setOnConnectionCallback([](std::weak_ptr<ix::WebSocket> webSocket,
                                      std::shared_ptr<ix::ConnectionState>) {
        if (auto socket = webSocket.lock()) {
            socket->setOnMessageCallback([](const ix::WebSocketMessagePtr& message) {
            if (message->type == ix::WebSocketMessageType::Open) {
                std::cout << "[Backend] React Dashboard Connected." << std::endl;
            }
            });
        }
    });

    auto listenResult = server.listen();
    if (!listenResult.first) {
        std::cerr << "Failed to start WebSocket server: " << listenResult.second << std::endl;
        ix::uninitNetSystem();
        return 1;
    }
    server.start();
    std::atomic<bool> streaming{true};
    std::thread streamThread(streamTransactions, std::ref(server), std::ref(streaming));
    std::cout << "[Backend] MoneyTrace streaming server running on ws://127.0.0.1:8080" << std::endl;

    auto db = generateMockData();
    int state = 0; // 0: Country, 1: Major Bank, 2: Small Bank, 3: Ledger
    
    int selectedCountryId = 0;
    int selectedMajorBankIdx = 0;
    int selectedSmallBankIdx = 0;

    while (true) {
        clearScreen();

        if (state == 0) {
            printHeader("GLOBAL MACRO VIEW");
            std::cout << CYAN << " AVAILABLE REGIONS:\n\n" << RESET;
            for (const auto& [id, country] : db) {
                std::cout << "  [" << GREEN << id << RESET << "] " << country.name << "\n";
            }
            printFooter();
            
            int choice;
            std::cin >> choice;
            if (choice == 0) break;
            if (db.count(choice)) {
                selectedCountryId = choice;
                state = 1;
            }
        } 
        else if (state == 1) {
            Country& c = db[selectedCountryId];
            printHeader(c.name + " > MAJOR INSTITUTIONS");
            
            for (size_t i = 0; i < c.majorBanks.size(); ++i) {
                std::cout << "  [" << GREEN << i + 1 << RESET << "] " << BOLD << c.majorBanks[i].name << RESET << "\n";
                std::cout << "      " << DIM << c.majorBanks[i].properties << RESET << "\n\n";
            }
            printFooter();
            
            int choice;
            std::cin >> choice;
            if (choice == 0) { state = 0; }
            else if (choice > 0 && choice <= (int)c.majorBanks.size()) {
                selectedMajorBankIdx = choice - 1;
                state = 2;
            }
        }
        else if (state == 2) {
            MajorBank& mb = db[selectedCountryId].majorBanks[selectedMajorBankIdx];
            printHeader(mb.name + " > SUBSIDIARY & REGIONAL NETWORK");
            
            std::cout << CYAN << std::left << std::setw(5) << "ID" 
                      << std::setw(30) << "INSTITUTION NAME" 
                      << std::setw(15) << "REGION" 
                      << "CLEARING CODE" << RESET << "\n";
            std::cout << DIM << "--------------------------------------------------------------------------------\n" << RESET;

            for (size_t i = 0; i < mb.network.size(); ++i) {
                SmallBank& sb = mb.network[i];
                std::cout << " [" << GREEN << i + 1 << RESET << "]  "
                          << std::left << std::setw(29) << sb.name 
                          << std::setw(15) << sb.region 
                          << sb.clearingCode << "\n";
            }
            printFooter();
            
            int choice;
            std::cin >> choice;
            if (choice == 0) { state = 1; }
            else if (choice > 0 && choice <= (int)mb.network.size()) {
                selectedSmallBankIdx = choice - 1;
                state = 3;
            }
        }
        else if (state == 3) {
            SmallBank& sb = db[selectedCountryId].majorBanks[selectedMajorBankIdx].network[selectedSmallBankIdx];
            printHeader(sb.name + " > TRANSACTION LEDGER");
            
            std::cout << CYAN << std::left << std::setw(15) << "DATE" 
                      << std::setw(25) << "COUNTERPARTY" 
                      << std::setw(12) << "TYPE" 
                      << std::setw(15) << "AMOUNT" 
                      << "RISK FLAG" << RESET << "\n";
            std::cout << DIM << "--------------------------------------------------------------------------------\n" << RESET;

            for (const auto& tx : sb.ledger) {
                std::cout << std::left << std::setw(15) << tx.date 
                          << std::setw(25) << tx.entity 
                          << std::setw(12) << tx.type 
                          << "$" << std::setw(14) << std::fixed << std::setprecision(2) << tx.amount;
                
                if (tx.flagged) std::cout << RED << "[HIGH RISK]" << RESET;
                else std::cout << GREEN << "[CLEARED]" << RESET;
                std::cout << "\n";
            }
            printFooter();
            
            int choice;
            std::cin >> choice;
            if (choice == 0) { state = 2; }
        }
    }

    clearScreen();
    std::cout << AMBER << "TERMINAL DISCONNECTED.\n" << RESET;
    streaming.store(false);
    server.stop();
    streamThread.join();
    ix::uninitNetSystem();
    return 0;
}