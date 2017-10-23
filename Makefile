list:
	gcloud beta functions list
make delete:
	gcloud beta functions delete $(fn)
deploy users:
	gcloud beta functions deploy $(fn) --source users --entry-point $(entry-point) --memory $(memory) --stage-bucket chefbox-delivery-storage --trigger-http