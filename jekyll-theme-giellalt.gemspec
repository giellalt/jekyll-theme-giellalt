require_relative "lib/jekyll-theme-giellalt/version"

Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-giellalt"
  spec.version       = JekyllThemeGiellalt::VERSION
  spec.authors       = ["GiellaLT"]
  spec.summary       = "Shared Jekyll theme for GiellaLT documentation sites."
  spec.homepage      = "https://github.com/giellalt/jekyll-theme-giellalt"
  spec.license       = "MIT"

  spec.metadata["plugin_type"] = "theme"

  spec.files = `git ls-files -z`.split("\x0").select do |f|
    f.match?(%r{^(_layouts|_includes|_sass|assets|lib)/|^(LICENSE|README)}i)
  end

  spec.require_paths = ["lib"]

  # Every gem below is a dependency the theme's layouts/includes need to
  # render (site.github, SEO tags, emoji, …) plus the Jekyll/Ruby version
  # pins the shared CI build used to declare separately. Centralizing them
  # here means a consumer repo declares nothing beyond this gem itself — see
  # README.md "Consumer repo setup".
  spec.add_runtime_dependency "jekyll", "~> 4.3"
  spec.add_runtime_dependency "jekyll-sass-converter", "~> 3.0" # Dart Sass; Jekyll 4 drops the old Ruby Sass
  spec.add_runtime_dependency "kramdown-parser-gfm"

  # Ruby 3.4 removed these from the default gems; harmless on earlier Rubies.
  spec.add_runtime_dependency "base64"
  spec.add_runtime_dependency "bigdecimal"
  spec.add_runtime_dependency "csv"
  spec.add_runtime_dependency "webrick"

  spec.add_runtime_dependency "jekyll-minifier" # production only, see lib/jekyll-theme-giellalt.rb
  spec.add_runtime_dependency "jekyll-seo-tag"
  spec.add_runtime_dependency "jekyll-github-metadata"
  spec.add_runtime_dependency "jekyll-include-cache"
  spec.add_runtime_dependency "jemoji"
  spec.add_runtime_dependency "jekyll-optional-front-matter"
  spec.add_runtime_dependency "jekyll-redirect-from"
  spec.add_runtime_dependency "jekyll-relative-links"
  spec.add_runtime_dependency "jekyll-titles-from-headings"
  spec.add_runtime_dependency "jekyll-default-layout"
  spec.add_runtime_dependency "jekyll-readme-index"
  spec.add_runtime_dependency "jekyll-sitemap"
  spec.add_runtime_dependency "jekyll-gist"
end
