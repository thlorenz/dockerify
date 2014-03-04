# dockerify [![build status](https://secure.travis-ci.org/thlorenz/dockerify.png)](http://travis-ci.org/thlorenz/dockerify)

Prepares any tarball containing a project so that a docker image can be built from i

```js
// TODO
```

## Installation

    npm install dockerify

## API

<!-- START docme generated API please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN docme TO UPDATE -->

<div>
<div class="jsdoc-githubify">
<section>
<article>
<div class="container-overview">
<dl class="details">
</dl>
</div>
<dl>
<dt>
<h4 class="name" id="tar"><span class="type-signature"></span>tar<span class="signature">(stream, opts)</span><span class="type-signature"> &rarr; {ReadableStream}</span></h4>
</dt>
<dd>
<div class="description">
<p>Modifies the given tar stream according to given options.
The main purpose is adding a Dockerfile so the resulting tar stream can be piped direclty into
<a href="http://docs.docker.io/en/latest/reference/api/docker_remote_api_v1.9/#build-an-image-from-dockerfile-via-stdin">docker build</a></p>
<h4>Note</h4>
<p>The returned tar stream emits the following events on top of the typical <code>ReadableStream</code> events:</p>
<ul>
<li><code>entry</code> emitted whenever an entry was processed and modified</li>
<li><code>existing-dockerfile</code> emitted whenever an existing Dockerfile was found and used instead of the supplied one</li>
<li><code>overriding-dockerfile</code> emitted whenever an exising Dockerfile was overridden with the supplied one</li>
</ul>
<h4>opts</h4>
<ul>
<li><em>{number=}</em>   <strong>opts.strip</strong>      <code>default: 0</code> sets the number of path segments to strip from each directory</li>
<li><em>{string=}</em>   <strong>opts.content</strong>    content of the Dockerfile, defaults to read(opts.dockerfile) or 'from ubuntu\n' </li>
<li><em>{string=}</em>   <strong>opts.dockerfile</strong> file to read Dockerfile content from in case <code>opts.content</code> wasn't provided</li>
<li><p><em>{boolean=}</em>  <strong>opts.override</strong>   <code>default: false</code> if the project contains a <code>Dockerfile</code> at the root
(after directories are stripped), it will be overwritten with the content/file provided if this option is set</p>
</li>
<li><p><em>{Object}</em>    <strong>opts.stats</strong>      allows setting mtime, mode, uname, gname, uid and gid of the created Dockefile</p>
</li>
</ul>
</div>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>stream</code></td>
<td class="type">
<span class="param-type">ReadableStream</span>
</td>
<td class="description last"><p>the original tar stream</p></td>
</tr>
<tr>
<td class="name"><code>opts</code></td>
<td class="type">
<span class="param-type">Object</span>
</td>
<td class="description last"><p>@see above</p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/thlorenz/dockerify/blob/master/index.js">index.js</a>
<span>, </span>
<a href="https://github.com/thlorenz/dockerify/blob/master/index.js#L80">lineno 80</a>
</li>
</ul></dd>
</dl>
<h5>Returns:</h5>
<div class="param-desc">
<p>the transformed tar stream</p>
</div>
<dl>
<dt>
Type
</dt>
<dd>
<span class="param-type">ReadableStream</span>
</dd>
</dl>
</dd>
<dt>
<h4 class="name" id="targz"><span class="type-signature"></span>targz<span class="signature">(stream, opts)</span><span class="type-signature"> &rarr; {ReadableStream}</span></h4>
</dt>
<dd>
<div class="description">
<p>Gunzips the .tar.gz stream and passes it along to <code>tar</code>.</p>
</div>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>stream</code></td>
<td class="type">
<span class="param-type">ReadableStream</span>
</td>
<td class="description last"><p>.tar.gz stream</p></td>
</tr>
<tr>
<td class="name"><code>opts</code></td>
<td class="type">
<span class="param-type">Object</span>
</td>
<td class="description last"><p>@see <code>tar</code></p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/thlorenz/dockerify/blob/master/index.js">index.js</a>
<span>, </span>
<a href="https://github.com/thlorenz/dockerify/blob/master/index.js#L131">lineno 131</a>
</li>
</ul></dd>
</dl>
<h5>Returns:</h5>
<div class="param-desc">
<p>the transformed tar stream</p>
</div>
<dl>
<dt>
Type
</dt>
<dd>
<span class="param-type">ReadableStream</span>
</dd>
</dl>
</dd>
</dl>
</article>
</section>
</div>

*generated with [docme](https://github.com/thlorenz/docme)*
</div>
<!-- END docme generated API please keep comment here to allow auto update -->

## License

MIT
