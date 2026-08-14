// Import QueryClient from TanStack Query.
// QueryClient manages the cache, requests, refetching, retries, etc.
import { QueryClient } from "@tanstack/react-query";


// Create one QueryClient for the application.
// We will provide this client to our React app using QueryClientProvider.
const queryClient = new QueryClient({

    // Default settings for TanStack Query.
    defaultOptions: {

        // Settings that apply to all useQuery() queries by default.
        queries: {

            // If a request fails, try the request 1 more time.
            // So there can be 2 attempts in total:
            // First attempt → fails → retry once → fails → return error.
            retry: 1,


            // Don't automatically refetch a query when the user
            // switches away from the browser tab and comes back.
            refetchOnWindowFocus: false,


            // Keep successfully fetched data "fresh" for 30 seconds.
            // 30,000 milliseconds = 30 seconds.
            //
            // During these 30 seconds, TanStack Query can use
            // the cached data instead of immediately fetching again.
            //
            // IMPORTANT:
            // staleTime does NOT delete the data after 30 seconds.
            // It only changes the data from "fresh" to "stale".
            staleTime: 30_000,
        }
    }
});

export default queryClient;