import { createAgentTask, type AgentTask } from './agents'

interface TaskGeneratorConfig {
  enabled: boolean
  agentIds: string[]
  maxTasksPerInterval: number
  agentIds: string[]
}

const defaultConfig: TaskGeneratorConfig = {

  intervalMinutes: 5,
  maxTasksPerInterval: 3,
  agentIds: []
 

const taskTemplates = {
  'doc-analyzer': [
  }
  pu
  }
  public start() {
    
    }
    if (!this.config.enabled) {
      return



  }
  public stop() {
      clearInterval(this.inte
    }

    const agentIds = this.config.agentIds.length > 0 
      : Object.keys(taskTemplates)
  }


      if (!templates || template
  }

  public start() {
      }
  }
  public upd
    }

    if (!this.config.enabled) {

      return
  }

  }

  return new AgentTaskGenerator(config)


  }

  public stop() {



    }



    const agentIds = this.config.agentIds.length > 0 

      : Object.keys(taskTemplates)















      }

  }








    this.config = { ...this.config, ...newConfig }

    if (wasRunning && this.config.enabled) {
      this.start()
    }
  }

  public getConfig(): TaskGeneratorConfig {
    return { ...this.config }
  }
}

export function createTaskGenerator(config?: Partial<TaskGeneratorConfig>): AgentTaskGenerator {
  return new AgentTaskGenerator(config)
}
