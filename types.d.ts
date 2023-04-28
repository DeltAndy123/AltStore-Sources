import type { Source } from "sidestore-source-types"

interface CustomSource extends Source {
  customData: {
    [key: string]: any
  }
}