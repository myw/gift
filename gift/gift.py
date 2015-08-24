import os
from flask import Flask, redirect, render_template, request, Response, url_for


app = Flask(__name__)


@app.route('/')
def index() -> Response:
  """ Render the index page, which prompts the user for a word """
  word = request.values.get('word', None)

  if word is None:
    return render_template('index.html')
  else:
    return redirect(url_for('gift', word=str(word)))


@app.route('/<word>')
def gift(word:str=None) -> Response:
  """ Render the page that shows the gift, given a seed word """
  # Always redirect to a canonical, lower-case representation of the word
  lowerword = word.lower()
  if lowerword == word:
    return render_template('gift.html', word=word)
  else:
    return redirect(url_for('gift', word=lowerword))


def static_reroute(filename:str) -> callable:
  """ Factory for making view functions that redirect to a static file """

  # Make a generic redirection function
  def redirected():
    """ Render the redirected file """
    return redirect(url_for('static', filename=filename))

  # Get the base of the filename, to use as the function name
  (base, _) = os.path.splitext(filename)

  # Rename the function
  redirected.__name__ = base

  # Make the route last: if you make it before you rename the function, you'll
  # get conflicts
  return app.route('/' + filename)(redirected)

favicon = static_reroute('favicon.ico')
browserconfig = static_reroute('browserconfig.xml')


if __name__ == '__main__':
  app.run(debug=True)
