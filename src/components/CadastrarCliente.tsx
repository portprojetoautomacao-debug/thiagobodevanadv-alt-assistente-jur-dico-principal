import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/tex
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  const [formData, setFormData
    cpfCnpj: '',
    telefone: '',

    cep: '',
    observacoes: ''


  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    tipo: 'fisica' as 'fisica' | 'juridica',
    observacoes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

  const h
  }
  return (
      <div className
          <UserPlus size
            Cadastrar Cliente
        </div>
      <

          <CardTitle>Informações do Cliente</CardTitle>

          <form onSubmit={handleSubmit} className="spa

                <Se
                 
                  <S
                  
                </Sel

                <La
                  i
                
                  place
              </div>
        
                <Inpu
                  value={formData.cpfCnpj}
                  required
               

     
  }

                  required
                />


  return (
                  onChange={(e) => handleCh
                  placeholde
              </div>
              <div className="space-y-2">
                <Input
            Cadastrar Cliente
               
        </div>

            

                  onChange={(e) => handleChange('endereco', e.target.
                  pl
          <CardTitle>Informações do Cliente</CardTitle>
              <div className="space-y-2">
                <Inpu
                  val
                  required
                />

                <Label htmlFor="estado">Estado *</Label>
                  id="estado"
                  onChange={(e) => handleCh
                  placeholder="UF"
                />

                <Label htmlFor="observacoes">Observações</Label>
                  id="observacoes"
                  onChange={(e) =>
                  rows={4
              </div>

              <Button
                disabled={isSubmitting}
              >
                {isSubmitti
              <Button
                variant="outline"
                  nome: ''
                  email: '',
                  
                  es

                })}
                Limpar
            </div>
        </CardContent>
                  value={formData.cpfCnpj}
}
                  required











                  required

                />
              </div>

              <div className="space-y-2">

                <Input






              </div>

              <div className="space-y-2">





                  required

                />

























                <Label htmlFor="estado">Estado *</Label>

                  id="estado"



                  placeholder="UF"

                />



                <Label htmlFor="observacoes">Observações</Label>

                  id="observacoes"





              </div>



              <Button

                disabled={isSubmitting}

              >



              <Button

                variant="outline"



                  email: '',







                })}

                Limpar

            </div>

        </CardContent>

    </div>

}
