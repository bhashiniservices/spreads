#!/bin/bash

export ODD_STATUS_PIPE=/tmp/odd_status_pipe
export EVEN_STATUS_PIPE=/tmp/even_status_pipe

export BOOK_NAME="ChaturacharyaCharitra"

export ODD_PAGE_NUM=2
export EVEN_PAGE_NUM=1

source /home/pi/git/spreads/gphoto2_scripts/setCameraEnv.sh

# arg1 : port
# arg2 : folder
captureImageFromCamera()
{
	if [[ $1 == "odd" ]]
	then
		PORT=$ODD_PORT
		gphoto2 --capture-image-and-download --port=$PORT

		filename="capt0000.cr2"
		fileext="cr2"
		newfilename=`printf "%s_%04d.%s" $BOOK_NAME $ODD_PAGE_NUM $fileext`
		mv $filename $newfilename
		#((ODD_PAGE_NUM=ODD_PAGE_NUM+2))
		echo "done" > $ODD_STATUS_PIPE
	else
		PORT=$EVEN_PORT
		gphoto2 --trigger-capture --wait-event-and-download=FILEADDED --port=$PORT

		filename="capt0000.jpg"
		fileext="jpg"
		newfilename=`printf "%s_%04d.%s" $BOOK_NAME $EVEN_PAGE_NUM $fileext`
		mv $filename $newfilename
		#((EVEN_PAGE_NUM=EVEN_PAGE_NUM+2))
		echo "done" > $EVEN_STATUS_PIPE
	fi
}

main()
{
	mkfifo $ODD_STATUS_PIPE
	mkfifo $EVEN_STATUS_PIPE
	while [[ true ]]
	do
		echo "Press ENTER to continue scanning"
		read
		captureImageFromCamera "odd" &
		captureImageFromCamera "even" &
		read < $ODD_STATUS_PIPE
		read < $EVEN_STATUS_PIPE
		((ODD_PAGE_NUM=ODD_PAGE_NUM+2))
		((EVEN_PAGE_NUM=EVEN_PAGE_NUM+2))
	done
}

main

