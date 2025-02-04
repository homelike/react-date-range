/* eslint-disable no-fallthrough */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  startOfDay,
  format,
  isSameDay,
  isAfter,
  isBefore,
  endOfDay,
  isValid,
  addDays,
} from 'date-fns';

class DayCell extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      hover: false,
      active: false,
      notificationActive: false,
    };
  }

  componentDidMount() {
    const { handleOnNotificationActive } = this.props;
    this.setState({ notificationActive: false });
    handleOnNotificationActive && handleOnNotificationActive();
  }

  componentDidUpdate() {
    const { handleOnNotificationActive, isMonthScrolling } = this.props;
    if (isMonthScrolling && this.state.notificationActive) {
      handleOnNotificationActive();
      this.setState({ notificationActive: false });
    }
  }
  handleKeyEvent = event => {
    const { day, onMouseDown, onMouseUp } = this.props;
    if ([13 /* space */, 32 /* enter */].includes(event.keyCode)) {
      if (event.type === 'keydown') onMouseDown(day);
      else onMouseUp(day);
    }
  };
  handleMouseEvent = event => {
    const {
      day,
      disabled,
      onPreviewChange,
      onMouseEnter,
      onMouseDown,
      onMouseUp,
      handleOnNotificationActive,
      ranges,
      isMobile,
      focusedRange,
    } = this.props;
    const stateChanges = {};

    const range = ranges.length && ranges[0];
    let startDate = range.startDate;
    let endDate = range.endDate;
    startDate = startDate ? endOfDay(startDate) : null;
    endDate = endDate ? startOfDay(endDate) : null;

    const isStartDate = isSameDay(startDate, this.props.day);
    const startEndSame = isSameDay(startDate, endDate);

    if (
      !isMobile &&
      isStartDate &&
      !startEndSame &&
      event.type !== 'mouseleave' &&
      event.type !== 'blur' &&
      focusedRange[1] === 1
    ) {
      this.setState({ notificationActive: true });
    }

    if (disabled) {
      if (event.type === 'mouseleave') {
        this.setState({ notificationActive: false });
        handleOnNotificationActive && handleOnNotificationActive();
      }
      onPreviewChange();
      return;
    }

    switch (event.type) {
      case 'mouseenter':
        onMouseEnter(day);
        onPreviewChange(day);
        stateChanges.hover = true;
        break;
      case 'blur':
      case 'mouseleave':
        stateChanges.hover = false;
        break;
      case 'mousedown':
        stateChanges.active = true;
        onMouseDown(day);
        break;
      case 'mouseup':
        event.stopPropagation();
        stateChanges.active = false;
        onMouseUp(day);
        break;
      case 'focus':
        onPreviewChange(day);
        break;
    }
    if (Object.keys(stateChanges).length) {
      this.setState(stateChanges);
    }
  };

  handleOnDayClick = () => {
    const { disabled } = this.props;

    if (disabled) this.setState({ notificationActive: true });
  };
  getClassNames = () => {
    const {
      isPassive,
      isToday,
      isWeekend,
      isStartOfWeek,
      isEndOfWeek,
      isStartOfMonth,
      isEndOfMonth,
      disabled,
      isWithInRangeDay,
      styles,
    } = this.props;

    return classnames(styles.day, {
      [styles.dayPassive]: isPassive,
      [styles.dayDisabled]: disabled,
      [styles.withInRangeDay]: isWithInRangeDay,
      [styles.dayToday]: isToday,
      [styles.dayWeekend]: isWeekend,
      [styles.dayStartOfWeek]: isStartOfWeek,
      [styles.dayEndOfWeek]: isEndOfWeek,
      [styles.dayStartOfMonth]: isStartOfMonth,
      [styles.dayEndOfMonth]: isEndOfMonth,
      [styles.dayHovered]: this.state.hover,
      [styles.dayActive]: this.state.active,
    });
  };
  renderPreviewPlaceholder = () => {
    const { preview, day, styles } = this.props;
    if (!preview) return null;
    const startDate = preview.startDate ? endOfDay(preview.startDate) : null;
    const endDate = preview.endDate ? startOfDay(preview.endDate) : null;
    const isInRange =
      (!startDate || isAfter(day, startDate)) && (!endDate || isBefore(day, endDate));
    const isStartEdge = !isInRange && isSameDay(day, startDate);
    const isEndEdge = !isInRange && isSameDay(day, endDate);
    return (
      <span
        className={classnames({
          [styles.dayStartPreview]: isStartEdge,
          [styles.dayInPreview]: isInRange,
          [styles.dayEndPreview]: isEndEdge,
        })}
        style={{ color: preview.color }}
      />
    );
  };
  renderSelectionPlaceholders = () => {
    const { styles, ranges, day, minimumTimeFromStart, focusedRange } = this.props;
    if (this.props.displayMode === 'date') {
      let isSelected = isSameDay(this.props.day, this.props.date);
      return isSelected ? (
        <span className={styles.selected} style={{ color: this.props.color }} />
      ) : null;
    }

    const inRanges = ranges.reduce((result, range) => {
      let startDate = range.startDate;
      let endDate = range.endDate;
      if (startDate && endDate && isBefore(endDate, startDate)) {
        [startDate, endDate] = [endDate, startDate];
      }
      startDate = startDate ? endOfDay(startDate) : null;
      endDate = endDate ? startOfDay(endDate) : null;
      const isInRange =
        (focusedRange[1] === 1 &&
          !isValid(endDate) &&
          isValid(startDate) &&
          isAfter(day, startDate) &&
          isBefore(day, addDays(minimumTimeFromStart, 1))) ||
        (isValid(endDate) &&
          isValid(startDate) &&
          isAfter(day, startDate) &&
          isBefore(day, endDate));
      const isStartEdge = !isInRange && isSameDay(day, startDate);
      const isEndEdge = !isInRange && isSameDay(day, endDate);
      const isFirstAvailableEndDay =
        //  !isValid(endDate) && isSameDay(minimumTimeFromStart, day);
        !isValid(endDate) && isSameDay(minimumTimeFromStart, day) && focusedRange[1] === 1;
      if (isInRange || isStartEdge || isEndEdge || isFirstAvailableEndDay) {
        return [
          ...result,
          {
            isStartEdge,
            isEndEdge: isEndEdge,
            isInRange,
            isFirstAvailableEndDay,
            ...range,
          },
        ];
      }
      return result;
    }, []);

    return inRanges.map((range, i) => (
      <span
        key={i}
        className={classnames({
          [styles.startEdge]: range.isStartEdge,
          [styles.endEdge]: range.isEndEdge,
          [styles.inRange]: range.isInRange,
          [styles.firstAvailableEndDay]: range.isFirstAvailableEndDay,
        })}
        style={{
          color: range.color || this.props.color,
        }}
      />
    ));
  };

  render() {
    const { dayContentRenderer, dayNotificationRender } = this.props;

    return (
      <button
        type="button"
        onMouseEnter={this.handleMouseEvent}
        onMouseLeave={this.handleMouseEvent}
        onFocus={this.handleMouseEvent}
        onMouseDown={this.handleMouseEvent}
        onMouseUp={this.handleMouseEvent}
        onBlur={this.handleMouseEvent}
        onPauseCapture={this.handleMouseEvent}
        onKeyDown={this.handleKeyEvent}
        onKeyUp={this.handleKeyEvent}
        onClick={this.handleOnDayClick}
        className={this.getClassNames(this.props.styles)}
        {...(this.props.disabled || this.props.isPassive ? { tabIndex: -1 } : {})}
        style={{ color: this.props.color }}>
        {this.renderSelectionPlaceholders()}
        {this.renderPreviewPlaceholder()}
        <span className={classnames(this.props.styles.dayNumber)}>
          {dayContentRenderer?.(this.props.day) || (
            <span>{format(this.props.day, this.props.dayDisplayFormat)}</span>
          )}
        </span>
        {this.state.notificationActive &&
          dayNotificationRender?.(this.props.day, this.props.disabled, this.props.isWithInRangeDay)}
      </button>
    );
  }
}

DayCell.defaultProps = {};

export const rangeShape = PropTypes.shape({
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  color: PropTypes.string,
  key: PropTypes.string,
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  showDateDisplay: PropTypes.bool,
});

DayCell.propTypes = {
  day: PropTypes.object.isRequired,
  dayDisplayFormat: PropTypes.string,
  date: PropTypes.object,
  ranges: PropTypes.arrayOf(rangeShape),
  availableFrom: PropTypes.object,
  preview: PropTypes.shape({
    startDate: PropTypes.object,
    endDate: PropTypes.object,
    color: PropTypes.string,
  }),
  onPreviewChange: PropTypes.func,
  handleOnNotificationActive: PropTypes.func,
  previewColor: PropTypes.string,
  disabled: PropTypes.bool,
  isMonthScrolling: PropTypes.bool,
  isMobile: PropTypes.bool,
  isWithInRangeDay: PropTypes.bool,
  minimumTimeFromStart: PropTypes.object,
  isPassive: PropTypes.bool,
  isToday: PropTypes.bool,
  isWeekend: PropTypes.bool,
  isStartOfWeek: PropTypes.bool,
  isEndOfWeek: PropTypes.bool,
  isStartOfMonth: PropTypes.bool,
  isEndOfMonth: PropTypes.bool,
  color: PropTypes.string,
  focusedRange: PropTypes.arrayOf(PropTypes.number),
  displayMode: PropTypes.oneOf(['dateRange', 'date']),
  styles: PropTypes.object,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onMouseEnter: PropTypes.func,
  dayContentRenderer: PropTypes.func,
  dayNotificationRender: PropTypes.func,
};

export default DayCell;
