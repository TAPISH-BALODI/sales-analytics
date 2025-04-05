const { gql } = require('apollo-server-express');

const typeDefs = gql`

  type CustomerSpending {
    customerId: ID!
    totalSpent: Float!
    averageOrderValue: Float!
    lastOrderDate: String!
  }

  type TopProduct {
    productId: ID!
    name: String!
    totalSold: Int!
  }

  type CategoryRevenue {
    category: String!
    revenue: Float!
  }

  type SalesAnalytics {
    totalRevenue: Float!
    completedOrders: Int!
    categoryBreakdown: [CategoryRevenue!]!
  }

  type Query {
    getCustomerSpending(customerId: ID!): CustomerSpending
    getTopSellingProducts(limit: Int!): [TopProduct!]!
    getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics
  }
    type Product {
  productId: ID!
  quantity: Int!
  price: Float!
}

type Order {
  id: ID!
  products: [Product!]!
}


  type Mutation {
  placeOrder(customerId: ID!, products: [OrderProductInput!]!): Order
}

input OrderProductInput {
  productId: ID!
  quantity: Int!
}

`;

module.exports = typeDefs;
