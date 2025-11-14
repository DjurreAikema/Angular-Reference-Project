export interface Checklist {
  id: string;
  title: string;
}

export type AddChecklist = Omit<Checklist, 'id'>;
export type EditChecklist = { id: Checklist['id']; data: AddChecklist };
export type RemoveChecklist = Checklist['id'];

// --- DTOs
export interface ChecklistDto {
  id: string;
  title: string;
}

// --- Mappers
export class ChecklistMapper {

  static fromDto(dto: ChecklistDto): Checklist {
    if (!dto.id || typeof dto.id !== 'string') {
      throw new Error('Invalid checklist DTO: id must be a non-empty string');
    }
    if (!dto.title || typeof dto.title !== 'string') {
      throw new Error('Invalid checklist DTO: title must be a non-empty string');
    }

    return {
      id: dto.id,
      title: dto.title
    };
  }

}
