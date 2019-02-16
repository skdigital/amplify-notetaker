import React, { Component } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { createNote, updateNote, deleteNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';

class App extends Component {
  state = {
    id: '',
    note: '',
    notes: []
  };

  async componentDidMount() {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  }

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
      this.updateNote();
    } else {
      const { note, notes } = this.state;
      const input = { note };
      const result = await API.graphql(graphqlOperation(createNote, { input }));
      const newNote = result.data.createNote;
      const updatedNotes = [newNote, ...notes];
      this.setState({ notes: updatedNotes, note: '' });
    }
  };

  handleSetNote = ({ note, id }) => {
    this.setState({ note, id });
  };

  updateNote = async () => {
    const { note, id } = this.state;
    const res = await API.graphql(
      graphqlOperation(updateNote, { input: { note, id } })
    );
    const updatedNote = res.data.updateNote;
    const noteIndex = this.state.notes.findIndex(n => n.id === updatedNote.id);
    if (noteIndex === -1) return;

    const notes = [...this.state.notes];
    notes[noteIndex] = updatedNote;
    this.setState({
      notes,
      note: '',
      id: null
    });
  };

  handleDeleteNote = async noteId => {
    const { notes } = this.state;
    const input = { id: noteId };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const deletedNoteId = result.data.deleteNote.id;
    const updatedNotes = notes.filter(note => deletedNoteId !== note.id);
    this.setState({ notes: updatedNotes });
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
