import React from "react";
import CentralBankPolicyHub from "./CentralBankPolicyHub";
import EntityGraph from "./EntityGraph";
import MacroLiquidityPanel from "./MacroLiquidityPanel";
import PaymentRailsMatrix from "./PaymentRailsMatrix";

export { CentralBankPolicyHub, EntityGraph, MacroLiquidityPanel, PaymentRailsMatrix };

export function dashboardFactory(node) {
  switch (node.getComponent()) {
    case "macroLiquidity":
    case "chart":
      return <MacroLiquidityPanel />;
    case "paymentRails":
    case "orderGrid":
      return <PaymentRailsMatrix />;
    case "centralBanks":
    case "news":
      return <CentralBankPolicyHub />;
    case "entityGraph":
    case "terminal":
      return <EntityGraph />;
    default:
      return <div className="missing-component">Component not found</div>;
  }
}