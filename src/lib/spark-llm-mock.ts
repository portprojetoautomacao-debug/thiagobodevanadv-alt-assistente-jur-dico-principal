// Mock implementation for @github/spark/llm when the package is not available
// This allows the app to build and run without the actual Spark LLM package

export const generateText = async (prompt: string, options?: any) => {
    console.warn('Spark LLM not available - using mock response');
    return `Mock response for: ${prompt}`;
};

export const generateJSON = async (prompt: string, schema?: any, options?: any) => {
    console.warn('Spark LLM not available - using mock JSON response');
    return { response: `Mock JSON response for: ${prompt}` };
};

export const streamText = async function* (prompt: string, options?: any) {
    console.warn('Spark LLM not available - using mock stream');
    yield 'Mock ';
    yield 'streaming ';
    yield 'response';
};

export const createLLM = (model: string, options?: any) => {
    console.warn('Spark LLM not available - using mock LLM');
    return {
        generateText,
        generateJSON,
        streamText,
    };
};

// Namespace export for compatibility
export const llm = {
    generateText,
    generateJSON,
    streamText,
    createLLM,
};

// Default export
const sparkLLM = {
    generateText,
    generateJSON,
    streamText,
    createLLM,
};

export default sparkLLM;