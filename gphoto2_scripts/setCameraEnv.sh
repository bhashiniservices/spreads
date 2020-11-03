#!/bin/bash

#Canon Rebel 3Ti
export ODD_PORT=""
#export ODD_CAM_DIR="/store_00020001/DCIM/101CANON"

#Nikon D3500
export EVEN_PORT="usb:001,014"
#export EVEN_CAM_DIR="/store_00010001/DCIM/101D3500"

setPorts()
{
	for PORT in `gphoto2 --list-ports | grep "usb:" | awk '{print $1}'`
	do
		MANUFACTURER=`gphoto2 --get-config manufacturer --port=$PORT`
		if [[ $MANUFACTURER =~ Canon.* ]]
		then
			ODD_PORT=$PORT
			gphoto2 --port=$PORT --set-config imageformat=0
			gphoto2 --port=$PORT --set-config imageformatsd=0
		elif [[ $MANUFACTURER =~ Nikon.* ]]
		then
			EVEN_PORT=$PORT
			gphoto2 --port=$PORT --set-config imagequality=2
		fi
	done

}

setPorts
