import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { clamp } from 'lodash';
import { func } from 'prop-types';

const makeScrollable = (WrappedComponent) => {
  class Scrollable extends Component {
    scrollView = React.createRef();
    scrollOffset = { x: 0, y: 0 };
    activeBlockOffset = { x: 0, y: 0 };
    keepScrolling = false;
    layout = null;

    onGrantBlock = (evt, gestureState, grid) => {
      this.panCapture = true;
      const activeBlockPosition = grid.getActiveBlock().origin;
      const x = activeBlockPosition.x - gestureState.x0;
      const y = activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y;
      this.activeBlockOffset = { x, y };
      return this.props.onGrantBlock(evt, gestureState, grid);
    };

    onMoveBlock = (evt, gestureState, grid) => {
      let dragPosition = {
        x: gestureState.moveX + this.activeBlockOffset.x,
        y: gestureState.moveY + this.activeBlockOffset.y,
      };
      const activeBlock = grid.getActiveBlock();
      const originalPosition = activeBlock.origin;

      const scrollThreshold = grid.props.rowHeight / 5;
      const scrollUp = dragPosition.y < scrollThreshold && this.scrollOffset.y > 0;
      const scrollDown =
        dragPosition.y > this.layout.height - this.layout.y - scrollThreshold &&
        dragPosition.y + this.scrollOffset.y + scrollThreshold < grid.layout.height;

      const scrollBy = (scrollUp * -1 + scrollDown * 1) * grid.props.rowHeight;

      const clampX = (x) => clamp(x, 0, grid.layout.width - grid.blockWidth);
      const clampY = (y) => clamp(y, 0, grid.layout.height - grid.props.rowHeight);

      if (!scrollDown && !scrollUp) {
        const actualDragPosition = {
          x: clampX(dragPosition.x),
          y: clampY(dragPosition.y + this.scrollOffset.y + scrollBy),
        };
        activeBlock.currentPosition.setValue(actualDragPosition);
        grid.moveBlock(originalPosition, actualDragPosition);
        this.keepScrolling = clearInterval(this.keepScrolling);
      } else {
        const actualDragPosition = {
          x: clampX(dragPosition.x),
          y: clampY(dragPosition.y + this.scrollOffset.y),
        };
        activeBlock.currentPosition.setValue(actualDragPosition);
        grid.moveBlock(originalPosition, actualDragPosition);
        this.keepScrolling = clearInterval(this.keepScrolling);
        this.keepScrolling = setInterval(() => {
          const activeBlock = grid.getActiveBlock();
          const originalPosition = activeBlock.origin;
          const actualDragPosition = {
            x: clampX(dragPosition.x),
            y: clampY(dragPosition.y + this.scrollOffset.y + scrollBy),
          };
          this.scrollView.current.scrollTo({ y: this.scrollOffset.y + scrollBy });
          activeBlock.currentPosition.setValue(actualDragPosition);
          grid.moveBlock(originalPosition, actualDragPosition);
        }, 250);
      }

      this.props.onMoveBlock(evt, gestureState, grid);
      return true;
    };

    onReleaseBlock = (evt, gestureState, grid) => {
      this.panCapture = false;
      this.keepScrolling = clearInterval(this.keepScrolling);
      return this.props.onReleaseBlock(evt, gestureState, grid);
    };

    onLayout = ({ nativeEvent }) => {
      this.layout = nativeEvent.layout;
    };

    onScroll = ({ nativeEvent }) => {
      this.scrollOffset = nativeEvent.contentOffset;
    };

    render = () => (
      <ScrollView
        ref={this.scrollView}
        onLayout={this.onLayout}
        onScroll={this.onScroll}
        scrollEnabled={!this.panCapture}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        removeClippedSubviews
      >
        <WrappedComponent
          {...this.props}
          onGrantBlock={this.onGrantBlock}
          onMoveBlock={this.onMoveBlock}
          onReleaseBlock={this.onReleaseBlock}
        />
      </ScrollView>
    );
  }

  Scrollable.propTypes = {
    onGrantBlock: func,
    onMoveBlock: func,
    onReleaseBlock: func,
  };

  Scrollable.defaultProps = {
    onGrantBlock: () => {},
    onMoveBlock: () => {},
    onReleaseBlock: () => {},
  };

  return Scrollable;
};

export default makeScrollable;
