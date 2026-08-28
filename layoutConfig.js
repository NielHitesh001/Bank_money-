export const defaultLayout = {
  global: {
    tabEnableFloat: true,
    tabSetEnableTabStrip: true,
  },
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 50,
        children: [
          { type: "tab", name: "Macro Liquidity", component: "macroLiquidity" },
          { type: "tab", name: "Global Financial Network", component: "entityGraph" },
        ],
      },
      {
        type: "row",
        weight: 50,
        children: [
          {
            type: "tabset",
            weight: 50,
            children: [
              { type: "tab", name: "Payment Rails Matrix", component: "paymentRails" },
            ],
          },
          {
            type: "tabset",
            weight: 50,
            children: [
              { type: "tab", name: "Central Bank Policy Hub", component: "centralBanks" },
            ],
          },
        ],
      },
    ],
  },
};