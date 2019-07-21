import React, { CSSProperties, PureComponent, ReactElement, FC } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { TScrollLocation } from './EngineCommons'
import { VirtuosoStore } from './VirtuosoStore'
import { TScrollContainer, VirtuosoView, TListContainer, DefaultListContainer, TFooterContainer } from './VirtuosoView'
import { TRender, TRenderProps } from './VirtuosoList'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

export type TItemContainer = React.FC<TRenderProps>

export interface VirtuosoProps {
  totalCount: number
  overscan?: number
  topItems?: number
  footer?: () => ReactElement
  item: (index: number) => ReactElement
  itemHeight?: number
  endReached?: (index: number) => void
  scrollingStateChange?: (isScrolling: boolean) => void
  style?: CSSProperties
  className?: string
  ScrollContainer?: TScrollContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
  ItemContainer?: TItemContainer
}

interface TVirtuosoPresentationProps {
  contextValue: VirtuosoState
  item: TRender
  footer?: () => ReactElement
  style?: CSSProperties
  className?: string
  itemHeight?: number
  ScrollContainer?: TScrollContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
}

export { TScrollContainer, TListContainer }

export const VirtuosoPresentation: FC<TVirtuosoPresentationProps> = ({
  contextValue,
  style,
  className,
  item,
  footer,
  itemHeight,
  ScrollContainer,
  ListContainer,
  FooterContainer,
}) => {
  return (
    <VirtuosoContext.Provider value={contextValue}>
      <VirtuosoView
        style={style || {}}
        className={className}
        item={item}
        footer={footer}
        fixedItemHeight={itemHeight !== undefined}
        ScrollContainer={ScrollContainer}
        FooterContainer={FooterContainer}
        ListContainer={ListContainer || DefaultListContainer}
      />
    </VirtuosoContext.Provider>
  )
}

export class Virtuoso extends PureComponent<VirtuosoProps, VirtuosoState> {
  public constructor(props: VirtuosoProps) {
    super(props)
    this.state = VirtuosoStore(props)
  }

  public static getDerivedStateFromProps(props: VirtuosoProps, state: VirtuosoState) {
    state.isScrolling.subscribeOnce(props.scrollingStateChange)
    state.endReached.subscribeOnce(props.endReached)
    state.topItemCount.next(props.topItems || 0)
    state.totalCount.next(props.totalCount)
    return null
  }

  private itemRender: TRender = (item, props) => {
    const ItemContainer = this.props.ItemContainer
    const children = this.props.item(item.index)

    if (ItemContainer) {
      return (
        <ItemContainer key={props.key} {...props}>
          {children}
        </ItemContainer>
      )
    } else {
      return <div {...props}>{children}</div>
    }
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex.next(location)
  }

  public render() {
    return (
      <VirtuosoPresentation
        contextValue={this.state}
        style={this.props.style}
        className={this.props.className}
        item={this.itemRender}
        footer={this.props.footer}
        itemHeight={this.props.itemHeight}
        ScrollContainer={this.props.ScrollContainer}
        FooterContainer={this.props.FooterContainer}
        ListContainer={this.props.ListContainer}
      />
    )
  }
}
