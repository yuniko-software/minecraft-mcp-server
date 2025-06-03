/**
 * This module provides functions to create response objects for the Model Context Protocol (MCP).
 * It includes functionality to create standard responses and error responses.
 */

import type { McpResponse } from '@minecraft-mcp-server/types';

/**
 * Creates a response object for the Model Context Protocol (MCP).
 * @param text - The text content to include in the response.
 * @returns A McpResponse object containing the text content.
 */
export function createResponse(text: string): McpResponse {
    return {
        content: [{ type: 'text', text }],
    };
}

/**
 * Creates an error response object for the Model Context Protocol (MCP).
 * @param error - An error object or a string representing an error message.
 * @returns A McpResponse object indicating an error, with the error message included in the content.
 */
export function createErrorResponse(error: Error | string): McpResponse {
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error(`Error: ${errorMessage}`);
    return {
        content: [{ type: 'text', text: `Failed: ${errorMessage}` }],
        isError: true,
    };
}
