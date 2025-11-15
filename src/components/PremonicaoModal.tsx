import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Copy, Check, Lightbulb, X, ArrowSquareOut, CaretRight } from '@phosphor-icons/react'
  isLoading: boolean
}
interface ProbabilityMeterProps {

function ProbabilityMeter({ perc
  const strokeWid
  const circumference

  isLoading: boolean
  error: string | null
}

interface ProbabilityMeterProps {
  percentage: number
}

function ProbabilityMeter({ percentage }: ProbabilityMeterProps) {
  const radius = 70
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
            r={normalizedRadius}
            cy={radius}
            animate={{ strokeDashoffset }}
            style={{
   

        <div className="absolute inse
            {percentage}%
        </div>
      <Badge
        style={{ backgroundColor: getC
   

}
interface CopyButtonProps {
}
function CopyButton({ text }: CopyButtonProps) {
          <circle
            stroke="oklch(0.88 0.005 260)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke={getColor(percentage)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>
      <Badge
        className="px-4 py-1.5 text-sm font-medium"
        style={{ backgroundColor: getColor(percentage), color: 'white' }}
      >
        {getLabel(percentage)}
      </Badge>
    </div>
  )
}

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
                            <CaretRight class
                   
                        </CardContent>
                    ))}
   

          
    <Button
                     
      size="icon"
                         
                          
     
      {copied ? (
                            <div className="flex ite
      ) : (
                                  va
      )}
             
  )
 

                                </Button>
  isOpen,
          
       
  isLoading,
  error,
              </>
  return (
      </DialogContent>
  )





              </div>





              </div>









        <ScrollArea className="flex-1">

            {isLoading && (










                  </p>








              </div>



              <>







                    </p>



                <Separator />

                <div className="space-y-4">








                          </div>




















                              </div>

















                                  >

                                  </a>

                              )}

                          </div>

                            {precedente.resumo_relevancia}

                        </CardContent>





            )}

        </ScrollArea>

    </Dialog>

}
