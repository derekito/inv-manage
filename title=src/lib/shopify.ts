@@ async function findShopifyProductBySku(client: ReturnType<typeof createAdminApiClient>, sku: string) {
  const query = `
    query {
      products(first: 10, query: "sku:'${sku}'") {
        edges {
          node {
            id
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  sku
                  inventoryItem {
                    id
                    inventoryLevel(locationId: "gid://shopify/Location/31145918566") {
                      id
                      available
                      onHand
                      committed
                      location {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
} 