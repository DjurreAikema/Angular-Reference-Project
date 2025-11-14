import {RemoveChecklist} from './checklist';

export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  checked: boolean;
}

export type AddChecklistItem = {
  item: Omit<ChecklistItem, 'id' | 'checklistId' | 'checked'>;
  checklistId: RemoveChecklist;
}

export type EditChecklistItem = {
  id: ChecklistItem['id'];
  data: AddChecklistItem['item'];
}

export type RemoveChecklistItem = ChecklistItem['id'];

// --- DTOs
export interface ChecklistItemDto {
  id: any;
  checklistId: any;
  title: any;
  checked: any;
}

// --- Mappers
export class ChecklistItemMapper {

  static fromDto(dto: ChecklistItemDto): ChecklistItem {
    if (!dto.id || typeof dto.id !== 'string') {
      throw new Error('Invalid checklist item DTO: id must be a non-empty string');
    }
    if (!dto.checklistId || typeof dto.checklistId !== 'string') {
      throw new Error('Invalid checklist item DTO: checklistId must be a non-empty string');
    }
    if (!dto.title || typeof dto.title !== 'string') {
      throw new Error('Invalid checklist item DTO: title must be a non-empty string');
    }
    if (!dto.checked || typeof dto.checked !== 'boolean') {
      throw new Error('Invalid checklist item DTO: checked must be a non-empty string');
    }

    return {
      id: dto.id,
      checklistId: dto.checklistId,
      title: dto.title,
      checked: dto.checked
    };
  }

}
