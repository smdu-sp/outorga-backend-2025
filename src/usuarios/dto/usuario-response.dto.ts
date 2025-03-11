import { ApiProperty } from "@nestjs/swagger"
import { Permissao } from "@prisma/client"

export class UsuarioResponseDTO {
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
    avatar: string
    @ApiProperty()
    dev: boolean
    @ApiProperty()
    permissoes?: Permissao[]
}

export class UsuarioPaginadoResponseDTO {
    @ApiProperty()
    total: number
    @ApiProperty()
    pagina: number
    @ApiProperty()
    limite: number
    @ApiProperty()
    data?: UsuarioResponseDTO[]
}

export class BuscarNovoResponseDTO {
    @ApiProperty()
    login: string
    @ApiProperty()
    nome: string
    @ApiProperty()
    email: string
}

export class BuscarFuncionariosResponseDTO {
    @ApiProperty()
    administrativos: UsuarioResponseDTO[]
    @ApiProperty()
    tecnicos: UsuarioResponseDTO[]
}

export class UsuarioDesativadoResponseDTO {
    @ApiProperty()
    desativado: boolean
}

export class UsuarioAutorizadoResponseDTO {
    @ApiProperty()
    autorizado: boolean
}
