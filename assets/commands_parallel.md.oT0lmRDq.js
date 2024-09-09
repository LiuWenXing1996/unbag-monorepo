import{_ as s,c as a,o as i,a1 as l}from"./chunks/framework.sVA4N1Y-.js";const F=JSON.parse('{"title":"parallel","description":"","frontmatter":{},"headers":[],"relativePath":"commands/parallel.md","filePath":"commands/parallel.md"}'),e={name:"commands/parallel.md"},t=l(`<h1 id="parallel" tabindex="-1">parallel <a class="header-anchor" href="#parallel" aria-label="Permalink to &quot;parallel&quot;">​</a></h1><p>同时运行多个<code>npm scripts</code>，并且可以通过自定义的异步函数控制每一个<code>npm scripts</code>的启动时机。</p><h2 id="用法" tabindex="-1">用法 <a class="header-anchor" href="#用法" aria-label="Permalink to &quot;用法&quot;">​</a></h2><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-ORVzu" id="tab-tTFsCsI" checked="checked"><label for="tab-tTFsCsI">npm</label><input type="radio" name="group-ORVzu" id="tab-vL_yhV_"><label for="tab-vL_yhV_">pnpm</label><input type="radio" name="group-ORVzu" id="tab-D3tFUeO"><label for="tab-D3tFUeO">yarn</label></div><div class="blocks"><div class="language-sh vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> parallel</span></span></code></pre></div><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> pnpm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> parallel</span></span></code></pre></div><div class="language-sh vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> yarn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> unbag</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> parallel</span></span></code></pre></div></div></div><h2 id="配置" tabindex="-1">配置 <a class="header-anchor" href="#配置" aria-label="Permalink to &quot;配置&quot;">​</a></h2><p>在对应的<code>unbag.config.js</code>的<code>parallel</code>的属性设置配置</p><h3 id="tempdir" tabindex="-1"><code>tempDir</code> <a class="header-anchor" href="#tempdir" aria-label="Permalink to &quot;\`tempDir\`&quot;">​</a></h3><ul><li>类型:<code>string</code></li><li>是否必填：否</li></ul><p>为了给每一个命令提供一个启动标记，<code>unbag</code>会将启动标记</p><ul><li>临时文件存放地址</li></ul><h3 id="commands" tabindex="-1"><code>commands</code> <a class="header-anchor" href="#commands" aria-label="Permalink to &quot;\`commands\`&quot;">​</a></h3><ul><li>类型:<code>ParallelCommand[]</code></li><li>是否必填：是</li><li>类型声明：</li></ul><div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> interface</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> ParallelCommand</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  name</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> string</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">  wait</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">?:</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> () </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> MaybePromise</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&lt;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">boolean</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt;;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  waitTimeout</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">?:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> number</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  waitInterval</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">?:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> number</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">  npmScript</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> string</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>例如：</p>`,14),n=[t];function p(h,d,k,r,o,c){return i(),a("div",null,n)}const m=s(e,[["render",p]]);export{F as __pageData,m as default};
