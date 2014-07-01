/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

$(document).ready(function() {
	if (!_.isUndefined(OC.Share) && !_.isUndefined(OCA.Files)) {
		// TODO: make a separate class for this or a hook or jQuery event ?
		if (OCA.Files.FileList) {
			var oldCreateRow = OCA.Files.FileList.prototype._createRow;
			OCA.Files.FileList.prototype._createRow = function(fileData) {
				var tr = oldCreateRow.apply(this, arguments);
				if (fileData.shareOwner) {
					tr.attr('data-share-owner', fileData.shareOwner);
					// user should always be able to rename a mount point
					if (fileData.isShareMountPoint) {
						tr.attr('data-permissions', fileData.permissions | OC.PERMISSION_UPDATE);
						tr.attr('data-reshare-permissions', fileData.permissions);
					}
				}
				return tr;
			};
		}

		// use delegate to catch the case with multiple file lists
		$('#content').delegate('#fileList', 'fileActionsReady',function(ev){
			// if no share action exists because the admin disabled sharing for this user
			// we create a share notification action to inform the user about files
			// shared with him otherwise we just update the existing share action.
			var fileList = ev.fileList;
			var $fileList = $(this);
			$fileList.find('[data-share-owner]').each(function() {
				var $tr = $(this);
				var $action;
				var owner;
				var message;
				var permissions = $tr.data('permissions');
				if(permissions & OC.PERMISSION_SHARE) {
					$action = $tr.find('[data-Action="Share"]');
					$action.addClass('permanent');
					owner = $tr.closest('tr').attr('data-share-owner');
					message = ' ' + t('files_sharing', 'Shared by {owner}', {owner: owner});
					$action.find('span').text(message);
				} else {
					var shareNotification = '<a class="action action-share-notification permanent"' +
							' data-action="Share-Notification" href="#" original-title="">' +
							' <img class="svg" src="' + OC.imagePath('core', 'actions/share') + '"></img>';
					$tr.find('.fileactions').append(function() {
						var owner = $(this).closest('tr').attr('data-share-owner');
						var shareBy = t('files_sharing', 'Shared by {owner}', {owner: owner});
						var $result = $(shareNotification + '<span> ' + shareBy + '</span></span>');
						$result.on('click', function() {
							return false;
						});
						return $result;
					});
				}
			});

			if (!OCA.Sharing.sharesLoaded){
				OC.Share.loadIcons('file', fileList);
				// assume that we got all shares, so switching directories
				// will not invalidate that list
				OCA.Sharing.sharesLoaded = true;
			}
			else{
				OC.Share.updateIcons('file', fileList);
			}
		});

		OCA.Files.fileActions.register(
				'all',
				'Share',
				OC.PERMISSION_SHARE,
				OC.imagePath('core', 'actions/share'),
				function(filename, context) {

			var $tr = context.$file;
			var itemType = 'file';
			if ($tr.data('type') === 'dir') {
				itemType = 'folder';
			}
			var possiblePermissions = $tr.data('reshare-permissions');
			if (_.isUndefined(possiblePermissions)) {
				possiblePermissions = $tr.data('permissions');
			}

			var appendTo = $tr.find('td.filename');
			// Check if drop down is already visible for a different file
			if (OC.Share.droppedDown) {
				if ($tr.data('id') !== $('#dropdown').attr('data-item-source')) {
					OC.Share.hideDropDown(function () {
						$tr.addClass('mouseOver');
						OC.Share.showDropDown(itemType, $tr.data('id'), appendTo, true, possiblePermissions, filename);
					});
				} else {
					OC.Share.hideDropDown();
				}
			} else {
				$tr.addClass('mouseOver');
				OC.Share.showDropDown(itemType, $tr.data('id'), appendTo, true, possiblePermissions, filename);
			}
		});
	}
});
