export interface CompletionState {
	suggestions: string[];
	currentIndex: number;
	originalInput: string;
	isCompleting: boolean;
}

export interface ParsedInput {
	currentInput: string;
	trimmedInput: string;
	words: string[];
	commandPart: string;
	isCompletingCommand: boolean;
	isCompletingArgument: boolean;
	argPart: string;
}

export function createCompletionState(): CompletionState {
	return {
		suggestions: [],
		currentIndex: -1,
		originalInput: "",
		isCompleting: false,
	};
}

export function parseInput(value: string): ParsedInput {
	const currentInput = value;
	const trimmedInput = currentInput.trim();
	const words = trimmedInput.split(" ");
	const commandPart = words[0] || "";
	const isAfterSpace = currentInput.endsWith(" ") && words.length === 1;

	return {
		currentInput,
		trimmedInput,
		words,
		commandPart,
		isCompletingCommand:
			words.length === 1 && !isAfterSpace && commandPart.length > 0,
		isCompletingArgument: (words.length > 1 || isAfterSpace) && !!commandPart,
		argPart: isAfterSpace ? "" : words[words.length - 1] || "",
	};
}

export function getSuggestions(
	commandPart: string,
	argPart: string,
	isCompletingCommand: boolean,
	commands: Record<string, unknown>,
	argumentMap: Record<string, string[]>,
): string[] {
	if (isCompletingCommand) {
		return Object.keys(commands)
			.filter((cmd) => cmd.startsWith(commandPart.toLowerCase()))
			.sort();
	}
	const availableArgs = argumentMap[commandPart] || [];
	const filtered =
		argPart === ""
			? availableArgs
			: availableArgs.filter((arg) => arg.startsWith(argPart.toLowerCase()));
	// Don't sort arguments - keep original order from argumentMap
	return filtered;
}

export function getGhostText(input: string, suggestion: string): string {
	if (
		suggestion.startsWith(input.toLowerCase()) &&
		suggestion.length > input.length
	) {
		return suggestion.substring(input.length);
	}
	return input === "" ? suggestion : "";
}

export function applySuggestion(
	suggestion: string,
	parsed: ParsedInput,
): string {
	if (parsed.isCompletingCommand) {
		return suggestion;
	}
	if (parsed.isCompletingArgument) {
		if (parsed.currentInput.endsWith(" ") && parsed.words.length === 1) {
			return `${parsed.trimmedInput} ${suggestion}`;
		}
		parsed.words[parsed.words.length - 1] = suggestion;
		return parsed.words.join(" ");
	}
	return parsed.currentInput;
}
