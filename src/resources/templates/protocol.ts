import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types';

import { getAllTemplates } from './utils';

/**
 * Formats all templates for the protocol response.
 */
export function formatTemplatesForProtocol() {
    return getAllTemplates().map(template => ({
        uriTemplate: `minecraft://template/${encodeURIComponent(template.name)}`,
        name: template.name,
        description: template.description,
        mimeType: 'application/json',
    }));
}

export function handleTemplatesListRequest(jsonRpcRequest: JSONRPCRequest) {
    if (jsonRpcRequest.method !== 'resources/templates/list') {
        return undefined;
    }
    const resourceTemplates = formatTemplatesForProtocol();
    return {
        jsonrpc: '2.0',
        id: jsonRpcRequest.id,
        result: { resourceTemplates },
    };
}
