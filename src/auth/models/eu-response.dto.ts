import { ApiProperty } from "@nestjs/swagger"
import { Permissao } from "@prisma/client"

export class EuResponseDTO {
    @ApiProperty()
    id: string
    @ApiProperty()
    nome: string
    @ApiProperty()
    login: string
    @ApiProperty()
    email: string
    @ApiProperty()
    status: boolean
    @ApiProperty()
    criado_em: Date
    @ApiProperty()
    alterado_em: Date
    @ApiProperty()
    avatar?: string;
    @ApiProperty()
    dev: boolean
}
