import {map, OperatorFunction} from 'rxjs';

export function mapDto<TDto, TModel>(
  mapperFn: (dtp: TDto) => TModel,
  errorMessage = 'Failed to map DTO to domain model'
): OperatorFunction<TDto, TModel> {
  return map((dto) => {
    if (dto == null) {
      throw new Error(`${errorMessage}: DTO is null or undefined`);
    }

    try {
      return mapperFn(dto);
    } catch (error) {
      throw new Error(
        `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
}

export function mapDtoArray<TDto, TModel>(
  mapperFn: (dto: TDto) => TModel,
  errorMessage = 'Failed to map DTO array to domain models'
): OperatorFunction<TDto[], TModel[]> {
  return map((dtos) => {
    if (!Array.isArray(dtos)) {
      throw new Error(`${errorMessage}: Expected array but got ${typeof dtos}`);
    }

    try {
      return dtos.map((dto, index) => {
        try {
          return mapperFn(dto);
        } catch (error) {
          throw new Error(
            `Item at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      });
    } catch (error) {
      throw new Error(
        `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
}
