import { ApiProperty } from "@nestjs/swagger"
import { Parcela, Tipo } from "@prisma/client"

export class ProcessoResponseDTO {
    @ApiProperty()
    id: string
    @ApiProperty()
    tipo?: Tipo
    @ApiProperty()
    codigo?: string
    @ApiProperty()
    num_processo: string
    @ApiProperty()
    protocolo_ad?: string
    @ApiProperty()
    cpf_cnpj?: string
    @ApiProperty()
    data_entrada?: Date
    @ApiProperty()
    parcelas?: Parcela[]
}

export class ProcessoPaginadoResponseDTO {
    @ApiProperty()
    total: number
    @ApiProperty()
    pagina: number
    @ApiProperty()
    limite: number
    @ApiProperty()
    data?: ProcessoResponseDTO[]
}
