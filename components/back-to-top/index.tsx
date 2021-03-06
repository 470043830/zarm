
import React, { PureComponent, MouseEvent, CSSProperties, ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import Scroller from '../scroller';
import { scrollTo } from '../scroller/ScrollContainer';
import domUtil, { ContainerType } from '../utils/dom';


export interface BackToTopProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  speed?: number;
  visibleDistance?: number;
  scrollContainer?: ContainerType;
  onClick?: (event?: MouseEvent<HTMLElement>) => void;
}

export interface BackToTopStates {
  visible: boolean;
}

export default class BackToTop extends PureComponent<BackToTopProps, BackToTopStates> {
  static displayName = 'BackToTop';

  static defaultProps: BackToTopProps = {
    prefixCls: 'za-back-to-top',
    speed: 100,
    visibleDistance: 400,
    scrollContainer: window,
  };

  readonly state: BackToTopStates = {
    visible: false,
  };

  private timer;

  private portalContainer: HTMLDivElement;

  private scroller: Scroller | null;

  componentDidMount() {
    this.parent.appendChild(this.getPortalContainer);
  }

  componentDidUpdate(prevProps: BackToTopProps) {
    const { scrollContainer } = this.props;

    if (prevProps.scrollContainer !== scrollContainer) {
      this.parent.appendChild(this.portalContainer);
      this.onScroll(this.scrollTop);
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.parent.removeChild(this.portalContainer);
  }

  get parent(): HTMLElement {
    if (!domUtil.canUseDOM || this.container === window) {
      return document.body;
    }
    return this.container as HTMLElement;
  }

  get container(): HTMLElement | Window {
    return this.scroller
      ? this.scroller!.scrollContainer
      : window;
  }

  get scrollTop(): number {
    return this.scroller
      ? this.scroller!.scrollTop
      : 0;
  }

  get renderPortal(): ReactPortal | null {
    const { prefixCls, style, scrollContainer, children } = this.props;
    const { visible } = this.state;

    const containerStyle: CSSProperties = {
      display: !visible ? 'none' : 'inline',
      position: this.container !== window ? 'absolute' : 'fixed',
      bottom: 50,
      right: 50,
      ...style,
    };

    return createPortal(
      <>
        <div className={prefixCls} style={containerStyle} onClick={this.scrollToTop}>
          {children}
        </div>
        <Scroller
          ref={(ele) => { this.scroller = ele; }}
          container={scrollContainer}
          onScroll={this.onScroll}
        />
      </>,
      this.getPortalContainer,
    );
  }

  get getPortalContainer(): HTMLDivElement {
    const { prefixCls, className } = this.props;
    if (!this.portalContainer) {
      const container = document.createElement('div');
      container.className = classnames(`${prefixCls!}-container`, className);
      this.portalContainer = container;
    }
    return this.portalContainer;
  }

  onScroll = (scrollTop: number): void => {
    this.setState({
      visible: scrollTop > this.props.visibleDistance!,
    });
  };

  scrollToTop = (e): void => {
    const { speed, onClick } = this.props;
    const { container } = this;

    if (typeof onClick === 'function') {
      onClick(e);
    }

    // 速度设置为0或者无穷大时，直接到顶
    if (speed === 0 || speed === Infinity) {
      scrollTo(container, 0);
      return;
    }

    this.timer = setInterval(() => {
      let st = this.scrollTop;
      st -= speed!;
      if (st > 0) {
        scrollTo(container, st);
      } else {
        scrollTo(container, 0);
        clearInterval(this.timer);
      }
    }, 10);
  };

  render() {
    if (!domUtil.canUseDOM) {
      return null;
    }

    return this.renderPortal;
  }
}
