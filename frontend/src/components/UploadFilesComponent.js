import React, { Component } from "react";
import Dropzone from "react-dropzone";
import UploadService from "../services/UploadFilesService";
import axiosInstance from "../Common";

export default class UploadFilesComponent extends Component {
  constructor(props) {
    super(props);
    this.upload = this.upload.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.getFiles = this.getFiles.bind(this);

    this.state = {
      selectedFiles: undefined,
      currentFile: undefined,
      progress: 0,
      message: "",
      fileInfos: [],
      edit: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        perPage: 5,
      },
    };

    this.pagination = {
      currentPage: 0,
      totalPages: 0,
      totalItems: 0,
      perPage: 5,
    };
  }

  componentDidMount() {
    this.getFiles();
  }

  getFiles() {
    UploadService.getFiles(
      this.state.pagination.currentPage - 1,
      this.state.pagination.perPage
    ).then((response) => {
      this.setState({
        fileInfos: response.data.content,
        pagination: {
          currentPage: response.data.number + 1,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalElements,
          perPage: response.data.size,
        },
      });
    });
  }

  upload() {
    let currentFile = this.state.selectedFiles[0];

    this.setState({
      progress: 0,
      currentFile: currentFile,
    });

    UploadService.upload(currentFile, (event) => {
      this.setState({
        progress: Math.round((100 * event.loaded) / event.total),
      });
    })
      .then((response) => {
        this.setState({
          message: response.data.message,
        });
      })
      .catch(() => {
        this.setState({
          message: "Could not upload the file!",
        });
      })
      .finally(() => {
        this.setState({
          selectedFiles: undefined,
          currentFile: undefined,
          progress: 0,
        });
        this.getFiles();
      });
  }

  onDrop(files) {
    if (files.length > 0) {
      this.setState({ selectedFiles: files });
    }
  }

  render() {
    const { selectedFiles, currentFile, progress, message, fileInfos, edit } =
      this.state;

    const { currentPage, totalPages, totalItems, perPage } =
      this.state.pagination;

    const apiUrl = axiosInstance.getUri();

    const renderSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      let k = 1024;
      let sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      let i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const onDelete = (id) => {
      const ok = window.confirm("Are you sure you want to delete this file?");
      if (!ok) return;

      UploadService.deleteFile(id).then((response) => {
        console.log(response.data);
        window.location.reload();
      });
    };

    const onEdit = (id) => {
      this.setState({ edit: [id] });
    };

    const onSync = () => {
      UploadService.syncFiles().then((response) => {
        console.log(response.data);
        window.location.reload();
      });
    };

    const onUpdate = (id) => {
      const newName = document.getElementById("filename").value;
      UploadService.updateFile(id, newName)
        .then((response) => {
          console.log(response.data);
          window.location.reload();
        })
        .finally(() => {
          this.setState({ edit: edit.filter((item) => item !== id) });
        });
    };

    const changePage = (page) => {
      console.log(page);
      this.state.pagination.currentPage = page;
      this.setState({
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          perPage: perPage,
        },
      });
      this.getFiles();
    };

    return (
      <div>
        <Dropzone onDrop={this.onDrop} multiple={false}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                {selectedFiles && selectedFiles[0].name ? (
                  <div className="selected-file">
                    {selectedFiles && selectedFiles[0].name}
                  </div>
                ) : (
                  <h4>Drag and drop file here, or click to select file</h4>
                )}
              </div>
              <aside className="selected-file-wrapper">
                <button
                  className="btn btn-secondary btn-lg btn-block"
                  disabled={!selectedFiles}
                  onClick={this.upload}
                >
                  Upload
                </button>
              </aside>
            </section>
          )}
        </Dropzone>
        <br></br>
        {currentFile && (
          <div className="progress mb-3">
            <div
              className="progress-bar progress-bar-info progress-bar-striped"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{ width: progress + "%" }}
            >
              {progress}%
            </div>
          </div>
        )}
        <div className="alert alert-light" role="alert">
          {message}
        </div>

        {fileInfos.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="font-weight-bold">My Files</span>
              <button
                className="btn btn-dark btn-sm float-right"
                onClick={onSync}
              >
                Sync Files
              </button>
            </div>
            <ul className="list-group list-group-flush">
              {fileInfos.map((file, i) => (
                <li
                  key={i}
                  className="list-group-item list-group-item-action list-unstyled"
                >
                  <div className="row">
                    <div className="col-auto">{i + 1}.</div>
                    {edit.includes(file.id) && (
                      <div className="col">
                        <input
                          id="filename"
                          type="text"
                          className="form-control form-control-sm"
                          defaultValue={file.title}
                        />
                      </div>
                    )}
                    {!edit.includes(file.id) && (
                      <div className="col text-truncate" title={file.filename}>
                        {file.filename}
                      </div>
                    )}
                    <div className="col">{renderSize(file.size)}</div>

                    {edit.includes(file.id) && (
                      <div className="col-auto">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onUpdate(file.id)}
                        >
                          Save
                        </button>
                      </div>
                    )}
                    {!edit.includes(file.id) && (
                      <div className="col-auto row no-wrap">
                        <a
                          className="mx-1 btn btn-secondary btn-sm"
                          onClick={() => onEdit(file.id)}
                        >
                          Edit
                        </a>
                        <a
                          href={`${apiUrl + file.url}`}
                          className="mx-1 btn btn-secondary btn-sm"
                        >
                          Download
                        </a>
                        <a
                          onClick={() => onDelete(file.id)}
                          className="mx-1 btn btn-danger btn-sm"
                        >
                          Delete
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination if contents are over perPage */}
            {totalItems > perPage && (
              <div className="card-footer">
                <div className="row">
                  <div className="col">
                    <p className="text-muted">
                      Showing {currentPage} of {totalPages} pages
                    </p>
                  </div>
                  <div className="col">
                    <nav aria-label="Page navigation example">
                      <ul className="pagination justify-content-end">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <a
                            className="page-link"
                            onClick={() => changePage(currentPage - 1)}
                          >
                            Previous
                          </a>
                        </li>
                        {[...Array(totalPages)].map((page, i) => (
                          <li
                            key={i}
                            className={`page-item ${
                              currentPage === i + 1 ? "active" : ""
                            }`}
                          >
                            <a
                              className="page-link"
                              onClick={() => changePage(i + 1)}
                            >
                              {i + 1}
                            </a>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <a
                            className="page-link"
                            onClick={() => changePage(currentPage + 1)}
                          >
                            Next
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
