import { useState, useMemo } from 'react'
import type { Process } from '@/types'
import type { Process } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, Plus, Gavel, DownloadSimple, Funnel } from '@phosphor-icons/react'
  SelectContent,
import ProcessDetailsDialog from './ProcessDetailsDialog'
} from '@/components/ui/select'
import { exportToCSV } from '@/lib/utils'
  const [search, setSearch] = 
import Fuse from 'fuse.js/min-basic'
  const 
  Select,
    return new F
  SelectItem,
    })
  SelectValue,
    let results = processes || 

      const fuseResults = fuse.search(sea
    }
    // Apply status filter
      results = results.filter(p => p.status === statusFilter)

  }, [processes, search, statusFilter, fuse])
  const handleEdit = (process: Process) => {

  // Fuzzy search with Fuse.js
    setSelectedProcess(process
  }
  const handleDelete = (processId: string) => {
    setDetailsOpen(false)
  }
    })
  }

      'Número CNJ': p.numeroCNJ,
      'Autor': p.autor,

      'Status': p.status,
      'Data Distribuição
      'Notas': p.notas || ''
    exportToCSV(exportData, 'processos')
    }

    // Apply status filter
  return (
      results = results.filter(p => p.status === statusFilter)
     

          <Button 
  }, [processes, search, statusFilter, fuse])

  const handleEdit = (process: Process) => {
            <Plus size={20} />
          </Button>
  }

          <MagnifyingGlass className="absolu
            placeholder="Buscar
            onChange={(e
   

  const handleDelete = (processId: string) => {
            <SelectValue placeholder="Status" />
    setDetailsOpen(false)
            <SelectItem valu
  }

      </div>
      {filteredProcesses.length === 0 ? (
  }

            </h3>
              {search 
      'Número CNJ': p.numeroCNJ,
            </p>
      'Autor': p.autor,
                Adi
            )}
        </Card>
      'Status': p.status,
            <Card key={proces
                <div className="flex items-sta
                  <Badge variant={
      'Notas': p.notas || ''
       
    exportToCSV(exportData, 'processos')
              </CardHeader>
  }

                
                  <p className="text-xs text-muted-foreground">Parte
  }

  return (
                  </div>
                    <p className="text-xs text-muted-foreground">Vara</p>
             

                  <div className="pt-2 border-t">
              
                        {process.pra
                      {process.prazos.some(p => p.urgente && !
                      )}
            Exportar CSV
              </Car
          ))}
      )}
            setDialogOpen(true)
        onOpe
            <Plus size={20} />
            setProcesses(
          </Button>
          setD
        }}

        open={detailsOpen}
        process={selectedProcess}
        onDelete={handleDelete}
    </div>
}









            <SelectValue placeholder="Status" />

          <SelectContent>







      </div>

      {filteredProcesses.length === 0 ? (





            </h3>

              {search 



            </p>





            )}

        </Card>







                  <Badge variant={





                  </Badge>

              </CardHeader>





                









                  </div>

                    <p className="text-xs text-muted-foreground">Vara</p>





                  <div className="pt-2 border-t">







                      )}

                  </div>



          ))}

      )}

      <ProcessDialog



        onSave={(process) => {







        }}



        open={detailsOpen}

        process={selectedProcess}

        onDelete={handleDelete}

    </div>

}
