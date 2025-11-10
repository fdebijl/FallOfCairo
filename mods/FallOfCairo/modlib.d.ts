/// <reference types="./index.d.ts" />
declare namespace modlib {
  export function Concat(s1: string, s2: string): string;
  export function And(...rest: boolean[]): boolean;
  type ConditionFunction = () => boolean;
  export function AndFn(...rest: ConditionFunction[]): boolean;
  export function getPlayerId(player: mod.Player): number;
  export function getTeamId(team: mod.Team): number;
  export function ConvertArray(array: mod.Array): any[];
  export function FilteredArray(array: mod.Array, cond: (currentElement: any) => boolean): mod.Array;
  export function IndexOfFirstTrue(array: mod.Array, cond: (element: any, arg: any) => boolean, arg?: any): number;
  export function IfThenElse<T>(condition: boolean, ifTrue: () => T, ifFalse: () => T): T;
  export function IsTrueForAll(array: mod.Array, condition: (element: any, arg: any) => boolean, arg?: any): boolean;
  export function IsTrueForAny(array: mod.Array, condition: (element: any, arg: any) => boolean, arg?: any): boolean;
  export function SortedArray(array: any[], compare: (a: any, b: any) => number): any[];
  export function Equals(a: any, b: any): boolean;
  export function WaitUntil(delay: number, cond: () => boolean): Promise<void>;
  export class ConditionState {
      lastState: boolean;
      constructor();
      update(newState: boolean): boolean;
  }
  export function getPlayerCondition(obj: mod.Player, n: number): ConditionState;
  export function getTeamCondition(team: mod.Team, n: number): ConditionState;
  export function getCapturePointCondition(obj: mod.CapturePoint, n: number): ConditionState;
  export function getMCOMCondition(obj: mod.MCOM, n: number): ConditionState;
  export function getVehicleCondition(obj: mod.Vehicle, n: number): ConditionState;
  export function getGlobalCondition(n: number): ConditionState;
  export function getPlayersInTeam(team: mod.Team): mod.Player[];
  export function ParseUI(...params: any[]): mod.UIWidget | undefined;
  export function DisplayCustomNotificationMessage(msg: mod.Message, custom: mod.CustomNotificationSlots, duration: number, target?: mod.Player | mod.Team): void;
  export function ShowEventGameModeMessage(event: mod.Message, target?: mod.Player | mod.Team): void;
  export function ShowHighlightedGameModeMessage(event: mod.Message, target?: mod.Player | mod.Team): void;
  export function ShowNotificationMessage(msg: mod.Message, target?: mod.Player | mod.Team): void;
  export function ClearAllCustomNotificationMessages(target: mod.Player): void;
  export function ClearCustomNotificationMessage(custom: mod.CustomNotificationSlots, target?: mod.Player | mod.Team): void;
}
