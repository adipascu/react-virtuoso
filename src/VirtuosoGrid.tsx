import React, { CSSProperties, ReactElement } from 'react'
import { VirtuosoGridEngine } from './VirtuosoGridEngine'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { useOutput, useSize } from './Utils'
import { viewportStyle } from './Style'
import { VirtuosoFiller } from './VirtuosoFiller'
import { TScrollLocation } from './EngineCommons'

type TContainer =
  | React.ComponentType<{ className: string; style?: CSSProperties; key?: number }>
  | keyof JSX.IntrinsicElements

export interface VirtuosoGridProps {
  totalCount: number
  overscan?: number
  item: (index: number) => ReactElement
  style?: CSSProperties
  className?: string
  ScrollContainer?: TScrollContainer
  ListContainer?: TContainer
  ItemContainer?: TContainer
  listClassName?: string
  itemClassName?: string
  scrollingStateChange?: (isScrolling: boolean) => void
  endReached?: (index: number) => void
}

type VirtuosoGridState = ReturnType<typeof VirtuosoGridEngine>

type VirtuosoGridFCProps = Omit<VirtuosoGridProps, 'overscan' | 'totalCount'> & { engine: VirtuosoGridState }

type TItemBuilder = (
  range: [number, number],
  item: (index: number) => ReactElement,
  itemClassName: string,
  ItemContainer: TContainer
) => ReactElement[]

export class VirtuosoGrid extends React.PureComponent<VirtuosoGridProps, VirtuosoGridState> {
  public state = VirtuosoGridEngine()

  public static getDerivedStateFromProps(props: VirtuosoGridProps, engine: VirtuosoGridState) {
    engine.overscan.next(props.overscan || 0)
    engine.totalCount.next(props.totalCount)
    engine.isScrolling.subscribeOnce(props.scrollingStateChange)
    engine.endReached.subscribeOnce(props.endReached)
    return null
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex.next(location)
  }

  public render() {
    return <VirtuosoGridFC {...this.props} engine={this.state} />
  }
}

const buildItems: TItemBuilder = ([startIndex, endIndex], item, itemClassName, ItemContainer) => {
  const items = []
  for (let index = startIndex; index <= endIndex; index++) {
    items.push(
      React.createElement(
        ItemContainer,
        {
          key: index,
          className: itemClassName,
        },
        item(index)
      )
    )
  }

  return items
}

const VirtuosoGridFC: React.FC<VirtuosoGridFCProps> = ({
  ScrollContainer,
  ItemContainer = 'div',
  ListContainer = 'div',
  className,
  item,
  itemClassName = 'virtuoso-grid-item',
  listClassName = 'virtuoso-grid-list',
  engine,
  style = { height: '40rem' },
}) => {
  const { itemRange, listOffset, totalHeight, gridDimensions, scrollTo, scrollTop } = engine

  const fillerHeight = useOutput<number>(totalHeight, 0)
  const translate = useOutput<number>(listOffset, 0)
  const listStyle = { marginTop: `${translate}px` }
  const itemIndexRange = useOutput(itemRange, [0, 0] as [number, number])

  const viewportCallbackRef = useSize(({ element, width, height }) => {
    const firstItem = element.firstChild!.firstChild as HTMLElement
    gridDimensions.next([width, height, firstItem.offsetWidth, firstItem.offsetHeight])
  })

  return (
    <VirtuosoScroller
      style={style}
      ScrollContainer={ScrollContainer}
      className={className}
      scrollTo={scrollTo.subscribe}
      scrollTop={scrollTop.next}
    >
      <div ref={viewportCallbackRef} style={viewportStyle}>
        {React.createElement(
          ListContainer,
          {
            style: listStyle,
            className: listClassName,
          },
          buildItems(itemIndexRange, item, itemClassName, ItemContainer)
        )}
      </div>

      <VirtuosoFiller height={fillerHeight} />
    </VirtuosoScroller>
  )
}
