'use client'

import { memo, useMemo, forwardRef } from 'react'
import { FixedSizeList as List } from 'react-window'
import { User } from 'lucide-react'
import type { Investor } from '@/lib/api'
import { InvestorsTable } from './investors-table'

interface VirtualizedInvestorsTableProps {
  investors: Investor[]
  isLoading: boolean
  height?: number
  itemHeight?: number
}

interface ListItemProps {
  index: number
  style: React.CSSProperties
  data: {
    investors: Investor[]
    itemHeight: number
  }
}

const ListItem = memo(forwardRef<HTMLDivElement, ListItemProps>(
  function ListItem({ index, style, data }, ref) {
    const { investors } = data
    const investor = investors[index]

    if (!investor) {
      return (
        <div ref={ref} style={style} className="p-4">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )
    }

    return (
      <div ref={ref} style={style}>
        <InvestorsTable investors={[investor]} isLoading={false} />
      </div>
    )
  }
))

export const VirtualizedInvestorsTable = memo(function VirtualizedInvestorsTable({
  investors,
  isLoading,
  height = 600,
  itemHeight = 120,
}: VirtualizedInvestorsTableProps) {
  const listData = useMemo(() => ({
    investors,
    itemHeight,
  }), [investors, itemHeight])

  if (isLoading) {
    return <InvestorsTable investors={[]} isLoading={true} />
  }

  if (investors.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No investors found</p>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters
        </p>
      </div>
    )
  }

  // Use regular table for small datasets to avoid virtualization overhead
  if (investors.length < 50) {
    return <InvestorsTable investors={investors} isLoading={false} />
  }

  return (
    <div className="border rounded-lg">
      <List
        height={height}
        width="100%"
        itemCount={investors.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {ListItem}
      </List>
    </div>
  )
})