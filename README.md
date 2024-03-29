# Audcast API

> REST API for Real-time Audio Podcast platform using Socket.io and WebRTC.

## API Documentation

https://documenter.getpostman.com/view/17116314/2s93CUGVHz

## API Endpoints

The application uses multiple Restful APIs to perform various actions. APIs working in this application are listed as follows:

| API               | Request  | Operation                                   |
| ----------------- | -------- | ------------------------------------------- |
| `/send-otp`       | `POST`   | Generate OTP and send it via phone or email |
| `/verify-otp`     | `POST`   | Verify OTP and register the user            |
| `/activate`       | `POST`   | Activate the account                        |
| `/refresh`        | `GET`    | Refresh the access token                    |
| `/logout`         | `POST`   | Logout user                                 |
| `/rooms`          | `GET`    | Get all the public rooms                    |
| `/rooms`          | `POST`   | Create new room                             |
| `/rooms/:id`      | `GET`    | Get room with {id}                          |
| `/rooms/:id`      | `PUT`    | Update room with {id}                       |
| `/rooms/:id`      | `DELETE` | Delete room with {id}                       |
| `/rooms/my-rooms` | `GET`    | Get rooms of current logged-in user         |

## How to Install

### Using Git (recommended)

1.  Clone the project from github. Change "myproject" to your project name.

```bash
git clone https://github.com/bskumawat09/audcast-api.git
```

### Using manual download ZIP

1.  Download repository
2.  Uncompress to your desired directory

### Install dependancies

1. Move to the directory where your project is stored.
2. Run the follwoing command.

```bash
npm install
```

### Setting up environment

1.  You will find a file named `.env.example` on root directory of project.
2.  Create a new file by copying and pasting the file and then renaming it to just `.env`
    ```bash
    cp .env.example .env
    ```
3.  Change the values of the file to your environment. Helpful comments added to `.env.example` file to understand the constants.

## How to run

### Running API server locally

```bash
node app.js
```

You will know server is running by checking the output of the command `node app.js`

```bash
Listening on port: 5000
Database connected
```

### Stopping API server

```
Press CTRL+C
```
