export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  category?: string;
  shortcut?: string;
  minLevel?: 'novice' | 'intermediate' | 'power';
  maxLevel?: 'novice' | 'intermediate' | 'power';
  action: () => void;
}

let commands: CommandItem[] = [];

export function registerCommand(cmd: CommandItem): void {
  // Remove existing command with same ID if present
  commands = commands.filter(c => c.id !== cmd.id);
  commands.push(cmd);
}

export function unregisterCommand(id: string): void {
  commands = commands.filter(c => c.id !== id);
}

export function getCommands(): CommandItem[] {
  // Return a copy to avoid accidental external mutation
  return [...commands];
}

export function clearCommands(): void {
  commands = [];
}
