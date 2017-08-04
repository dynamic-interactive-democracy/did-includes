# did-includes

Hello friend!
This library exposes a bunch of "includes" for a system supporting sociocratic organization.

That sentence ought to make you ask a bunch of questions.
If you are in doubt as to what sociocracy is, we will have to refer you to your search engine of choice for now.
If you are wondering what includes are, and how they fit into the big picture, read on.

An include is what we call a bit of code that is easily included (see?) on another website.
The website points the include at a DOM element in their HTML page (a `div` created for the purpose, for example), and the include takes complete control of that div, and provides some kind of functionality.

The includes should be responsive, so they can be pointed at any div.
They should also be standalone and not require very much of the integrating developer.

## Get started testing the includes

To see the current includes and play around with them, you should run the manual test environment.

You must have a postgres server installed on your computer to do so.

First, install all the required dependencies:

```
npm install
```

Then run the manual test environment:

```
npm run manual-test
```

Per default, this will assume you have a postgres database running on localhost with a user `postgres` with password `postgres`, which owns a database `postgres`, in which we are going to do things.
It will then launch the API server on port 3333 and the manual test interface on port 3334.
You can manually override this configuration.
Here's a list of the available command line arguments and an example of use:

- `manualTestPort` sets the port on which the manual test interface will run (default 3334)
- `apiPort` sets the port on which the API sever will run (default 3333)
- `pgHost` sets the host of the postgres database server (default localhost)
- `pgUser` sets the username used to log into the postgres database (default postgres)
- `pgPass` sets the password used to log into the postgres database (default postgres)
- `pgDb` sets the database to use for the api server (default postgres)

For example, to run the test interface on port 3000 (instead of 3334) and use a database call did-test (instead of postgres), run the following command:

```
npm run manual-test -- --manualTestPort=3000 --pgDb=did-test
```
