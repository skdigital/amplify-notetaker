import React, { Component } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { createNote, updateNote, deleteNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from './graphql/subscriptions';

class App extends Component {
  state = {
    id: '',
    note: '',
    notes: []
  };

  async componentDidMount() {
    this.getNotes();
    this.createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(
          note => note.id !== newNote.id
        );
        const updatedNotes = [...prevNotes, newNote];
        this.setState({ notes: updatedNotes });
      }
    });
    this.deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = this.state.notes.filter(
          note => note.id !== deletedNote.id
        );
        this.setState({ notes: updatedNotes });
      }
    });
    this.updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const { notes } = this.state;
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = this.state.notes.findIndex(
          note => note.id === updatedNote.id
        );
        const updatedNotes = [
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1)
        ];
        this.setState({ notes: updatedNotes, note: '', id: '' });
      }
    });
  }

  componentWillUnmount() {
    this.createNoteListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
    this.updateNoteListener.unsubscribe();
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  };

  handleChangeNote = event => this.setState({ note: event.target.value });

  hasExistingNote = () => {
    const { notes, id } = this.state;
    if (id) {
      // is the id a valid id?
      const isNote = notes.findIndex(note => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  handleAddNote = async event => {
    event.preventDefault();
    // check if note already exists, if so update
    if (this.hasExistingNote()) {
      this.handleUpdateNote();
    } else {
      const { note } = this.state;
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
      this.setState({ note: '' });
    }
  };

  handleSetNote = ({ note, id }) => {
    this.setState({ note, id });
  };

  handleUpdateNote = async () => {
    const { note, id } = this.state;
    await API.graphql(graphqlOperation(updateNote, { input: { note, id } }));
    // const updatedNote = res.data.updateNote;
    // const noteIndex = this.state.notes.findIndex(n => n.id === updatedNote.id);
    // if (noteIndex === -1) return;

    // const notes = [...this.state.notes];
    // notes[noteIndex] = updatedNote;
    // this.setState({
    //   notes,
    //   note: '',
    //   id: null
    // });
  };

  handleDeleteNote = async noteId => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
  };

  render() {
    const { notes, note, id } = this.state;
    return (
      <div className="flex flex-column items-center justify center pa3 bg-washed-red">
        <h1 className="code f2-1"> Amplify Notetaker </h1>
        {/* Note Form */}
        <form onSubmit={this.handleAddNote} className="mb3">
          <input
            onChange={this.handleChangeNote}
            type="text"
            className="pa2 f4"
            placeholder="Write your note"
            value={note}
          />
          <button className="pa2 f4" type="submit">
            {id ? 'Update Note' : 'Add Note'}
          </button>
        </form>

        {/* Notes List */}
        <div>
          {notes.map(item => (
            <div key={item.id} className="flex items-center">
              <li
                onClick={() => this.handleSetNote(item)}
                className="list pa1 f3"
              >
                {item.note}
              </li>
              <button
                onClick={() => this.handleDeleteNote(item.id)}
                className="bg-transparent bn f4"
              >
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });

// O12287931@nwytg.net
