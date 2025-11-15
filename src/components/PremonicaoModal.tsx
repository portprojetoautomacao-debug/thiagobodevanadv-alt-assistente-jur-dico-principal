import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components
import { ScrollArea } from '@/components/ui/s
import { toast } from 'sonner'
import type { PremonicaoJuridica } from '@/types'
interface PremonicaoModalProps {
  onClose: () => void
  data: PremonicaoJuridica | n
}
interface ProbabilityMeterProps {

function ProbabilityMeter({ perc
  const strokeWid
  const circumference

    if (pct >= 75) return 'oklch(
    if (pct >= 25) ret
 

    if (pct >= 50) return 'Probab
    return 'Probabil


        <svg height={radius * 2} width={radius * 2}>
            stroke=
            strokeWidth=
            cx={radius}
          />
            stroke={getColor(percentage)}

            strokeDashoffset={strokeD
            r={normalizedRadius}
            cy={radius}
            animate={{ strokeDashoffset }}
            style={{
   

        <div className="absolute inse
            {percentage}%
        </div>
      <Badge
        className="text-sm px-3 py-1"
   

  )

  const [copied, setCopied] = us
  const handleCopy = async () => {
    setCopied(tru
    setTimeout(() => setCopied(false), 200

    <Button
      size="icon"
      onClick={handleCo
      {copied ? (
      ) : (
      )}
  )

  isOpen,
  isLoading,
  error,
  return (
      <DialogContent className="
          <div classNam
              <div clas
              </div>
                <DialogTitle className="te
                  <p className="text-sm text-muted-foreg
                  </
              </div>
            <Button variant="ghost" size=
            </
        </Di
        <Separ
        <ScrollArea className="max-h-[calc(90vh-120px)]">
            {isLoading && (
                <motion.d
                 
              
            
            
                  </p>
              </div>

       
                  <div classNa
              
          
   
 

              <>
                  <ProbabilityMeter percentag

                    <p className="
                    </p>
                </d
                <Separator />
                <div className="space-y-4">
   

          
           
                     
                 
                          </div>
                      </Ca
     


           
                    {data.precedente
        
             
   
 

                              </div>
         
          
            
       
        
                          
          
                                    target="_blan
                                  >
                                  </a>
                              )}
                          </div>
                            {precedente.resumo_relevancia}
                        </CardContent>
                    
                </d
            )}
        </ScrollArea>
    </Dialog>
}











































































































































