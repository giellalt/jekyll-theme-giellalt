require "jekyll-theme-giellalt/version"

# Requiring this file is how a consumer's Gemfile activates every plugin the
# theme's layouts/includes rely on (site.github, SEO tags, emoji, etc.) — see
# the `group :jekyll_plugins` note in this gem's own Gemfile/README. Jekyll's
# PluginManager runs `Bundler.require(:jekyll_plugins)`, which requires this
# file, which requires the rest; a consumer never lists these individually.
require "jekyll-seo-tag"
require "jekyll-github-metadata"
require "jekyll-include-cache"
require "jemoji"
require "jekyll-optional-front-matter"
require "jekyll-redirect-from"
require "jekyll-relative-links"
require "jekyll-titles-from-headings"
require "jekyll-default-layout"
require "jekyll-readme-index"
require "jekyll-sitemap"
require "jekyll-gist"

# Minification is a production-build concern, not a theme concern: local
# `jekyll serve` skips it for speed and readable output, the shared CI build
# (giellalt/.github's docs.yml) sets JEKYLL_ENV=production.
require "jekyll-minifier" if ENV["JEKYLL_ENV"] == "production"
