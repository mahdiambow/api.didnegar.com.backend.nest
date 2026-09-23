## Product-linked WordPress files → SeaweedFS

```sh
npm run db:migrate:product-media-files -- --year 2017
```

This is a physical-file migration, not a metadata importer. It selects only
Nest `media` rows connected through `product_media`, derives their legacy
`wp-content/uploads/YYYY/...` paths, and sends that one-year manifest to the
WordPress server over password-authenticated SSH. The remote worker needs Node
and `sharp` installed in `WORDPRESS_OPTIMIZER_DIR`; it converts JPG/JPEG/PNG
to WebP, copies other product-linked file types unchanged, and records missing
or invalid source files under that year's optimized directory.

After a year completes, the controller reloads the independent `FILE_SERVER_*`
environment variables, streams only successful output files to that server,
and runs its local `aws s3 sync` command against SeaweedFS. AWS credentials
must already be configured for `FILE_SERVER_SSH_USERNAME` on the file server.
The script does not yet update `media.url` or product image JSON: URLs remain
unchanged until a separately verified URL-mapping migration is run.

Use `--all` to process every discovered year. The required environment variable
names are documented in `.env.example`. Every remote operation is resumable;
the controller writes `migration-product-media-files-report.jsonl` by default.