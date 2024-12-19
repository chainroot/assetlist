import { gql } from "graphql-request";
export const ALL_CHAINS = gql `
  query getChains {
    chains {
      networkName
    }
  }
`;
export const GET_CHAIN_ASSETS = gql `
  query GetChainAssets(
    $networkName: String!
    $searchValue: String
    $pagination: PaginationRequest
  ) {
    chainAssets(
      networkName: $networkName
      pagination: $pagination
      searchValue: $searchValue
    ) {
      results {
        amount
        denom
      }
      paginationInfo {
        currentPage
        limit
        totalCount
        totalPage
      }
    }
  }
`;
