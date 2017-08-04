Documentation
=============

Here's how to use the did-includes library.

Getting started
---------------

You should probably depend on the library hosted on some CDN.
Or you can download a version and locally host it.

There is a script and a css file to include in your page's `<head>`.

Here are the different variances of the library found:

- **locale:** The lib is built for different languages. There is a da_DK, en_UK and en_US version.
- **markdown parser included?:** If you already have a markdown parser in your project, you can get a more lightweight version of the project.
  The no-md versions of the script (available for each locale) require that you pass in a markdown parser after the URL and integration parameters to the library.

Once that is done, you have access to the library as such:

```js
//Markdown parser included (normal version):
var did = require("did")(apiUrl, integration);

//no-md version:
var did = require("did")(apiUrl, integration, markdownParser);
```

Here, `apiUrl` is a string containing the URL of the API you are integrating with.
For example, `"https://did-api-alpha.deranged.dk/"`.

The `integration` object expects the following values (all required for optimal performance):

- `circles` is an object containing integration specifications relating to circles.
  - `view` is a function taking a single argument, `id`, which responds to requests to view a circle.
    For example, `function(id) { showCircle(id); }`.
  - `edit` is a function taking a single argument, `id`, which responds to requests to go to the edit view for a circle.
- `users` is an object containing integration specifications relating to users.
  - `view` is a function taking a single argument, `id`, which responds to requests to view a user.
    For example, `function(id) { showUser(id); }`.

The `markdownParser` argument (only required on no-md version) is a function that takes a markdown string and produces an HTML string.
With a library such as marked, it could be as simple as `(md) => marked(md)`.
It is on you to make sure the parser is secure and, for example, strips out `script` tags.
You might want to disallow custom HTML altogether.

The returned value, `did` is the library.
It contains two fields:

- `api` is the API client, which lets you easily interact with the API backend.
- `includes` is a collection of includes that can be instantiated and rendered in parts of your website, yielding control to the library.
  This means that you do not have to deal with implementation of views yourself, as these are fully supported as includes.

The first thing you should do, probably also in your web page's `head`-element, is specify the user that is currently acting:

```js
did.api.asUser("user id", "user auth token");
```

The user ID is your system's internal reference to the user.
The auth token is retrieved with the `users.create` API call (see the section below).

API
---

Accessible as `did.api`, the API contains various categories of API calls.
The calls are passed directly to the did API, and you should consult its [documentation](https://github.com/dynamic-interactive-democracy/did-api/#did-api-endpointsdocs) to see the data structures expected by the endpoints.

The supported endpoints are:

- `users.create`...
