import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import difference from 'lodash.difference';
import find from 'lodash.find';

import Keyboard from './Keyboard';

class Piano extends React.Component {
  static propTypes = {
    startNote: PropTypes.number.isRequired,
    endNote: PropTypes.number.isRequired,
    onNoteStart: PropTypes.func.isRequired,
    onNoteStop: PropTypes.func.isRequired,
    renderNoteLabel: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    width: PropTypes.number,
    keyboardShortcuts: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        midiNumber: PropTypes.number.isRequired,
      }),
    ),
    playbackNotes: PropTypes.arrayOf(PropTypes.number.isRequired),
  };

  static defaultProps = {
    renderNoteLabel: ({ keyboardShortcut, midiNumber, isActive, isAccidental }) => (
      <div
        className={classNames('ReactPiano__NoteLabel', {
          'ReactPiano__NoteLabel--active': isActive,
          'ReactPiano__NoteLabel--black': isAccidental,
          'ReactPiano__NoteLabel--white': !isAccidental,
        })}
      >
        {keyboardShortcut}
      </div>
    ),
  };

  constructor(props) {
    super(props);

    this.state = {
      activeNotes: [],
      isMouseDown: false,
      touchEvents: false,
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchstart', this.onTouchStart);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchstart', this.onTouchStart);
  }

  componentDidUpdate(prevProps, prevState) {
    // If keyboard shortcuts change, any activeNotes will not
    // correctly fire keyUp events. First cancel all activeNotes.
    if (prevProps.keyboardShortcuts !== this.props.keyboardShortcuts) {
      this.setState({
        activeNotes: [],
      });
    }

    if (this.state.activeNotes !== prevState.activeNotes) {
      this.handleNoteChanges({
        prevActiveNotes: prevState.activeNotes || [],
        nextActiveNotes: this.state.activeNotes || [],
      });
    }
  }

  handleNoteChanges = ({ prevActiveNotes, nextActiveNotes }) => {
    const notesStarted = difference(prevActiveNotes, nextActiveNotes);
    const notesStopped = difference(nextActiveNotes, prevActiveNotes);
    notesStarted.forEach((midiNumber) => {
      this.onNoteStop(midiNumber);
    });
    notesStopped.forEach((midiNumber) => {
      this.onNoteStart(midiNumber);
    });
  };

  getMidiNumberForKey = (key) => {
    if (!this.props.keyboardShortcuts) {
      return null;
    }
    const shortcut = find(this.props.keyboardShortcuts, { key: key });
    return shortcut && shortcut.midiNumber;
  };

  getKeyForMidiNumber = (midiNumber) => {
    if (!this.props.keyboardShortcuts) {
      return null;
    }
    const shortcut = find(this.props.keyboardShortcuts, { midiNumber: midiNumber });
    return shortcut && shortcut.key;
  };

  onKeyDown = (event) => {
    // Don't conflict with existing combinations like ctrl + t
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const midiNumber = this.getMidiNumberForKey(event.key);
    if (midiNumber) {
      this.onNoteStart(midiNumber);
    }
  };

  onKeyUp = (event) => {
    // Don't conflict with existing combinations like ctrl + t
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const midiNumber = this.getMidiNumberForKey(event.key);
    if (midiNumber) {
      this.onNoteStop(midiNumber);
    }
  };

  onNoteStart = (midiNumber) => {
    if (this.props.isLoading) {
      return;
    }
    // Prevent duplicate note firings
    const isActive = this.state.activeNotes.includes(midiNumber);
    if (isActive) {
      return;
    }
    // Pass in previous activeNotes for recording functionality
    this.props.onNoteStart(midiNumber, this.state.activeNotes);
    this.setState((prevState) => ({
      activeNotes: prevState.activeNotes.concat(midiNumber).sort(),
    }));
  };

  onNoteStop = (midiNumber) => {
    if (this.props.isLoading) {
      return;
    }
    const isInactive = !this.state.activeNotes.includes(midiNumber);
    if (isInactive) {
      return;
    }
    // Pass in previous activeNotes for recording functionality
    this.props.onNoteStop(midiNumber, this.state.activeNotes);
    this.setState((prevState) => ({
      activeNotes: prevState.activeNotes.filter((note) => midiNumber !== note),
    }));
  };

  onMouseDown = () => {
    this.setState({
      isMouseDown: true,
    });
  };

  onMouseUp = () => {
    this.setState({
      isMouseDown: false,
    });
  };

  onTouchStart = () => {
    this.setState({
      touchEvents: true,
    });
  };

  renderNoteLabel = ({ midiNumber, isActive, isAccidental }) => {
    const keyboardShortcut = this.getKeyForMidiNumber(midiNumber);
    if (!keyboardShortcut) {
      return null;
    }
    return this.props.renderNoteLabel({ keyboardShortcut, midiNumber, isActive, isAccidental });
  };

  render() {
    return (
      <Keyboard
        startNote={this.props.startNote}
        endNote={this.props.endNote}
        activeNotes={this.props.playbackNotes || this.state.activeNotes}
        disabled={this.props.isLoading}
        width={this.props.width}
        gliss={this.state.isMouseDown}
        touchEvents={this.state.touchEvents}
        renderNoteLabel={this.renderNoteLabel}
        onNoteStart={this.onNoteStart}
        onNoteStop={this.onNoteStop}
      />
    );
  }
}

export default Piano;
