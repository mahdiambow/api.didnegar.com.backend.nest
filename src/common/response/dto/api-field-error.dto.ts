import { ApiProperty } from '@nestjs/swagger';

export class ApiFieldErrorDto {
  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ example: 'Invalid email' })
  message: string;
}
