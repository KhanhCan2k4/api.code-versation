import { Controller, Get } from '@nestjs/common';
import { CharacterService } from 'src/services/CharacterService';

@Controller("characters")
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  getAll(): string {
    return this.characterService.getAll();
  }
}
