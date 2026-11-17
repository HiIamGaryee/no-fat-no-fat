export const toolActionIds=["open_midnight_food_rescue","open_excuse_court","open_food_detective","open_movement_roulette","open_habit_autopsy","open_evidence_lab","suggest_mission","view_progress"] as const;
export type ToolActionId=(typeof toolActionIds)[number];
export interface ToolAction { id:ToolActionId; context?:string; }
export type ToolEventType="food_decision_recorded"|"excuse_case_created"|"excuse_action_completed"|"food_comparison_saved"|"movement_mission_completed"|"habit_investigation_completed"|"recovery_action_created"|"evidence_reviewed";
export type ToolId="midnight-food"|"excuse-court"|"food-detective"|"movement-roulette"|"habit-autopsy"|"evidence-lab";
export interface ToolEvent { id:string;type:ToolEventType;tool:ToolId;timestamp:string;referenceId:string;metadata:Record<string,string|number|boolean|null>; }
export interface ToolEventStore { version:1;events:ToolEvent[]; }
