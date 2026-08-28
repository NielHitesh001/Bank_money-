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
          { type: "tab", name: "Live Order Book", component: "orderGrid" },
              { type: "tab", name: "Entity Network", component: "entityGraph" },
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
              { type: "tab", name: "AAPL Chart", component: "chart" },
            ],
          },
          {
            type: "tabset",
            weight: 50,
            children: [
              { type: "tab", name: "News Feed", component: "news" },
              { type: "tab", name: "Terminal", component: "terminal" },
            ],
          },
        ],
      },
    ],
  },
};