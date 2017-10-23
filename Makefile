# Helpers
list:
	gcloud beta functions list
delete:
	gcloud beta functions delete $(fn)
call:
	gcloud beta functions call $(fn)
call-data:
	gcloud beta functions call $(fn) --data $(data)

# Deployment
deploy users:
	gcloud beta functions deploy $(fn) --source users --entry-point $(entry) --memory $(mem) --stage-bucket chefbox-delivery-functions --trigger-http
deploy-default users:
	gcloud beta functions deploy $(fn)